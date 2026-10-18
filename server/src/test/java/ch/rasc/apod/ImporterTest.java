package ch.rasc.apod;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import ch.rasc.apod.config.AppPaths;
import ch.rasc.apod.config.AppProperties;
import ch.rasc.apod.entity.Apod;
import okhttp3.MediaType;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Response;
import okhttp3.ResponseBody;
import tools.jackson.databind.json.JsonMapper;

class ImporterTest {

	private static final LocalDate DATE = LocalDate.of(2026, 10, 17);

	private static final String API = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/";

	private static final String IMAGE = "https://assets.science.nasa.gov/comet.jpg?w=2628&fit=clip";

	@TempDir
	Path directory;

	private final JsonMapper mapper = JsonMapper.builder().build();

	private final Map<String, Reply> replies = new HashMap<>();

	private final List<String> requests = new ArrayList<>();

	private ExodusManager database;

	private Importer importer;

	private byte[] jpeg;

	@BeforeEach
	void setUp() throws IOException {
		AppProperties properties = new AppProperties();
		properties.setImagesPath(this.directory.resolve("images").toString());
		properties.setXodusPath(this.directory.resolve("database").toString());
		// A missing optional compressor must still leave usable original images.
		properties.setJpegRecompressExe(this.directory.resolve("missing-compressor").toString());
		AppPaths paths = new AppPaths();
		this.database = new ExodusManager(properties, paths);
		OkHttpClient client = new OkHttpClient.Builder().addInterceptor(chain -> {
			String url = chain.request().url().toString();
			this.requests.add(url);
			Reply reply = this.replies.get(url);
			if (reply == null) {
				throw new IOException("Unexpected request: " + url);
			}
			return new Response.Builder().request(chain.request())
				.protocol(Protocol.HTTP_1_1)
				.code(reply.status())
				.message("Test response")
				.body(ResponseBody.create(reply.body(), MediaType.get(reply.contentType())))
				.build();
		}).build();
		this.importer = new Importer(this.mapper, properties, paths, this.database, client);
		ByteArrayOutputStream output = new ByteArrayOutputStream();
		ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "jpg", output);
		this.jpeg = output.toByteArray();
		this.replies.put(IMAGE, new Reply(200, "image/jpeg", this.jpeg));
	}

	@AfterEach
	void closeDatabase() {
		if (this.database != null) {
			this.database.destroy();
		}
	}

	@Test
	void importsNewApiImageAndCleansHtmlWithoutFetchingArticleOrCredits() throws IOException {
		respond(DATE, entry(DATE));
		assertTrue(this.importer.importData(DATE));
		Apod stored = this.database.readApod(DATE.toString());
		assertNotNull(stored);
		assertEquals("3D & 67P", stored.getTitle());
		assertEquals("ESA & the Rosetta team", stored.getCredit());
		assertEquals("A comet & its jets. More detail.", stored.getExplanation());
		assertEquals("comet.jpg", stored.getUrl());
		assertEquals("comet.jpg", stored.getHdUrl());
		assertArrayEquals(this.jpeg, Files.readAllBytes(imagePath("comet.jpg")));
		assertEquals(List.of(API + "261017", IMAGE), this.requests);
		assertFalse(this.importer.importData(DATE));
		assertEquals(2, this.requests.size(), "Existing records must not be downloaded again");
	}

	@Test
	void usesCopyrightWhenCreditIsMissing() throws IOException {
		Map<String, Object> data = entry(DATE);
		data.remove("credit");
		data.put("copyright", "<b>Jane &amp; John</b>");
		respond(DATE, data);
		assertTrue(this.importer.importData(DATE));
		assertEquals("Jane & John", this.database.readApod(DATE.toString()).getCredit());
	}

	@Test
	void skipsVideoAndNonJpegEntries() throws IOException {
		Map<String, Object> data = entry(DATE);
		data.put("media_type", "video");
		respond(DATE, data);
		assertFalse(this.importer.importData(DATE));
		data.put("media_type", "image");
		data.put("hdurl", "https://assets.science.nasa.gov/animation.gif");
		respond(DATE, data);
		assertFalse(this.importer.importData(DATE));
		assertNull(this.database.readApod(DATE.toString()));
		assertEquals(List.of(API + "261017", API + "261017"), this.requests);
	}

	@Test
	void backfillSkipsUnicodePngAndContinuesToNextDay() throws IOException {
		LocalDate date = LocalDate.of(2026, 10, 10);
		Map<String, Object> data = entry(date);
		data.put("hdurl", "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/2026/october/"
				+ "2026_10_10_PZ_Jesli\u010dky_01_1500px.png");
		respond(date, data);
		respond(date.plusDays(1), entry(date.plusDays(1)));
		assertEquals(1, this.importer.importRange(date, date.plusDays(1)));
		assertNull(this.database.readApod(date.toString()));
		assertNotNull(this.database.readApod(date.plusDays(1).toString()));
		assertEquals(List.of(API + "261010", API + "261011", IMAGE), this.requests);
	}

	@Test
	void importsRawAndEncodedUnicodeJpegNamesAsPortableLocalFiles() throws IOException {
		String raw = "https://assets.science.nasa.gov/JESLI\u010cKY 01.JPEG?w=1500#image";
		String encoded = "https://assets.science.nasa.gov/JESLI%C4%8CKY%2001.JPEG?w=1500#image";
		String localFileName = null;
		for (String url : List.of(raw, encoded)) {
			Map<String, Object> data = entry(DATE);
			data.put("hdurl", url);
			respond(DATE, data);
			this.replies.put(HttpUrl.get(url).toString(), new Reply(200, "image/jpeg", this.jpeg));
			assertTrue(this.importer.importData(DATE));
			Apod stored = this.database.readApod(DATE.toString());
			assertTrue(stored.getUrl().matches("[a-zA-Z0-9._-]+"));
			assertTrue(stored.getUrl().endsWith(".JPEG"));
			assertEquals(stored.getUrl(), stored.getHdUrl());
			assertArrayEquals(this.jpeg, Files.readAllBytes(imagePath(stored.getUrl())));
			if (localFileName != null) {
				assertEquals(localFileName, stored.getUrl());
			}
			localFileName = stored.getUrl();
			this.database.deleteApod(stored);
		}
	}

	@Test
	void classifiesEncodedAndMalformedUrlPathsWithoutFilesystemParsing() {
		Apod apod = new Apod();
		apod.setUrl("https://assets.science.nasa.gov/Jesli\u010dky 01.png?download=photo.jpg");
		assertFalse(this.importer.isJpeg(apod));
		apod.setUrl("https://assets.science.nasa.gov/image%00.png");
		assertFalse(this.importer.isJpeg(apod));
		apod.setUrl("https://assets.science.nasa.gov/Jesli%C4%8Dky%2001.JPEG?w=1500");
		assertTrue(this.importer.isJpeg(apod));
		apod.setUrl("old-local-file.jpg");
		assertTrue(this.importer.isJpeg(apod));
	}

	@Test
	void doesNotSaveHtmlReturnedForAnImageAndCanRetry() throws IOException {
		respond(DATE, entry(DATE));
		this.replies.put(IMAGE, new Reply(200, "text/html", "<html>Error</html>".getBytes(StandardCharsets.UTF_8)));
		assertFalse(this.importer.importData(DATE));
		assertNull(this.database.readApod(DATE.toString()));
		assertFalse(Files.exists(imagePath("comet.jpg")));
		this.replies.put(IMAGE, new Reply(200, "image/jpeg", this.jpeg));
		assertTrue(this.importer.importData(DATE));
	}

	@Test
	void failedPreviewFallsBackToDownloadedHdFile() throws IOException {
		Map<String, Object> data = entry(DATE);
		String preview = "https://assets.science.nasa.gov/preview.jpeg";
		data.put("url", preview);
		respond(DATE, data);
		this.replies.put(preview, new Reply(503, "text/plain", new byte[0]));
		assertTrue(this.importer.importData(DATE));
		Apod stored = this.database.readApod(DATE.toString());
		assertEquals("comet.jpg", stored.getUrl());
		assertEquals("comet.jpg", stored.getHdUrl());
	}

	@Test
	void failedHdFallsBackToDownloadedPreviewFile() throws IOException {
		Map<String, Object> data = entry(DATE);
		String preview = "https://assets.science.nasa.gov/preview.jpeg";
		data.put("url", preview);
		respond(DATE, data);
		this.replies.put(IMAGE, new Reply(503, "text/plain", new byte[0]));
		this.replies.put(preview, new Reply(200, "image/jpeg", this.jpeg));
		assertTrue(this.importer.importData(DATE));
		Apod stored = this.database.readApod(DATE.toString());
		assertEquals("preview.jpeg", stored.getUrl());
		assertEquals("preview.jpeg", stored.getHdUrl());
	}

	@Test
	void rejectsMalformedResponsesAndUnexpectedDates() {
		this.replies.put(API + "261017",
				new Reply(200, "text/html", "<html>Error</html>".getBytes(StandardCharsets.UTF_8)));
		assertThrows(IOException.class, () -> this.importer.importData(DATE));
		respond(DATE, entry(DATE.minusDays(1)));
		assertThrows(IOException.class, () -> this.importer.importData(DATE));
		assertNull(this.database.readApod(DATE.toString()));
	}

	@Test
	void importsDateRangeInOrderAndSkipsExistingEntries() throws IOException {
		respond(DATE.minusDays(1), entry(DATE.minusDays(1)));
		respond(DATE, entry(DATE));
		assertEquals(2, this.importer.importRange(DATE.minusDays(1), DATE));
		assertEquals(List.of(API + "261016", IMAGE, API + "261017", IMAGE), this.requests);
		assertEquals(0, this.importer.importRange(DATE.minusDays(1), DATE));
		assertThrows(IllegalArgumentException.class, () -> this.importer.importRange(DATE, DATE.minusDays(1)));
	}

	@Test
	void stopsBackfillOnApiFailureButSkipsMissingDates() throws IOException {
		this.replies.put(API + "261016", new Reply(503, "text/plain", new byte[0]));
		assertThrows(IOException.class, () -> this.importer.importRange(DATE.minusDays(1), DATE));
		assertEquals(List.of(API + "261016"), this.requests);
		this.replies.put(API + "261016", new Reply(404, "application/json", "{}".getBytes(StandardCharsets.UTF_8)));
		respond(DATE, entry(DATE));
		assertEquals(1, this.importer.importRange(DATE.minusDays(1), DATE));
	}

	private Map<String, Object> entry(LocalDate date) {
		Map<String, Object> data = new LinkedHashMap<>();
		data.put("date", date.toString());
		data.put("title", "3D &amp; 67P");
		data.put("media_type", "image");
		data.put("url", "https://science.nasa.gov/image-article/apod-2026-october-17-3d-67p/");
		data.put("hdurl", IMAGE);
		data.put("credit", "<a href=\"https://esa.int\">ESA</a> &amp; the Rosetta team");
		data.put("explanation",
				"<strong>Explanation: </strong>A comet &amp; its jets.<br>More detail."
						+ "<br><strong>APOD's main NASA site has moved:</strong> migration notice"
						+ "<br><strong>Tomorrow's picture:</strong> open space");
		data.put("post_id", 123);
		data.put("basic_html", "<html>Unused page</html>");
		return data;
	}

	private void respond(LocalDate date, Map<String, Object> data) {
		String key = date.toString().replace("-", "").substring(2);
		this.replies.put(API + key, new Reply(200, "application/json", this.mapper.writeValueAsBytes(data)));
	}

	private Path imagePath(String fileName) {
		return this.directory.resolve("images/2026/10/17").resolve(fileName);
	}

	private record Reply(int status, String contentType, byte[] body) {
	}

}
