package ch.rasc.apod;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.jsoup.Jsoup;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import ch.rasc.apod.config.AppPaths;
import ch.rasc.apod.config.AppProperties;
import ch.rasc.apod.entity.Apod;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class Importer {

	private final static DateTimeFormatter shortFormat = DateTimeFormatter.ofPattern("yyMMdd");

	private final static DateTimeFormatter longFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");

	private final ObjectMapper om;

	private final OkHttpClient httpClient;

	private final ExodusManager exodusManager;

	private final Path imageDirectory;

	private final AppProperties appProperties;

	public Importer(ObjectMapper om, AppProperties appProperties, AppPaths appPaths, ExodusManager exodusManager,
			OkHttpClient httpClient) throws IOException {
		this.om = om;
		this.appProperties = appProperties;
		this.httpClient = httpClient;
		this.exodusManager = exodusManager;
		this.imageDirectory = appPaths.resolve(appProperties.getImagesPath());
		Files.createDirectories(this.imageDirectory);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void onStartup() {
		Application.logger.info("onStartup: running initial import");
		scheduledImport();
	}

	@Scheduled(cron = "0 7 10,22 * * *")
	public void scheduledImport() {
		if (!Application.runJobs) {
			Application.logger.info("scheduledImport: runJobs is false, skipping");
			return;
		}

		Application.logger.info("scheduledImport: starting import run");
		LocalDate c = LocalDate.now(ZoneId.systemDefault());
		for (int j = 0; j < 4; j++) {
			try {
				boolean imported = importData(c);
				if (imported) {
					Application.logger.info("scheduledImport: successfully imported {}", c);
				}
			}
			catch (IOException e) {
				Application.logger.error("scheduledImport", e);
			}
			c = c.minusDays(1);
		}
		Application.logger.info("scheduledImport: import run finished");
	}

	public int importRange(LocalDate from, LocalDate to) throws IOException {
		if (from.isAfter(to)) {
			throw new IllegalArgumentException("The import start date must be on or before the end date");
		}
		int imported = 0;
		// Import oldest first so clients that sync by their latest date see the backfill.
		for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
			if (importData(date)) {
				imported++;
			}
		}
		return imported;
	}

	public boolean importData(LocalDate localDate) throws IOException {
		String date = localDate.format(longFormat);

		if (this.exodusManager.readApod(date) != null) {
			return false;
		}

		String apiUrl = this.appProperties.getNasaApiUrl();
		String url = apiUrl + (apiUrl.endsWith("/") ? "" : "/") + localDate.format(shortFormat);

		Request request = new Request.Builder().url(url).header("Accept", "application/json").build();
		try (Response response = this.httpClient.newCall(request).execute()) {
			if (!response.isSuccessful()) {
				if (response.code() == 404) {
					Application.logger.info("importData: no APOD available for {}", date);
					return false;
				}
				throw new IOException("NASA API returned HTTP " + response.code() + " for date " + date);
			}

			try (ResponseBody body = response.body()) {
				if (body != null) {
					Apod apod = readApod(body.string(), date);

					if (!"image".equals(apod.getMediaType())) {
						Application.logger.info("importData: skipping {} (media_type={}, not an image)", date,
								apod.getMediaType());
						return false;
					}

					if (!isJpeg(apod)) {
						Application.logger.info("importData: skipping {} (not a JPEG image)", date);
						return false;
					}

					// The new API's url is an article permalink, not an image URL.
					String hdUrl = isJpegUrl(apod.getHdUrl()) ? apod.getHdUrl() : null;
					String imageUrl = isJpegUrl(apod.getUrl()) ? apod.getUrl() : hdUrl;
					String hdFile = hdUrl != null ? downloadAndOptimize(date, hdUrl, true) : null;
					String imageFile = imageUrl != null ? downloadAndOptimize(date, imageUrl, false) : null;

					if (hdFile != null || imageFile != null) {
						// Store only local filenames, including when one download failed.
						apod.setHdUrl(hdFile != null ? hdFile : imageFile);
						apod.setUrl(imageFile != null ? imageFile : hdFile);
						this.exodusManager.saveApod(apod);
						return true;
					}

					Application.logger.warn("importData: no image downloaded for {} (hdUrl={}, url={})", date,
							apod.getHdUrl(), apod.getUrl());
				}
			}
		}

		return false;
	}

	private Apod readApod(String json, String requestedDate) throws IOException {
		try {
			JsonNode data = this.om.readTree(json);
			Apod apod = this.om.treeToValue(data, Apod.class);
			if (apod == null || !requestedDate.equals(apod.getDate())) {
				throw new IOException("NASA API returned an unexpected APOD date for " + requestedDate);
			}
			String credit = apod.getCredit();
			if (!StringUtils.hasText(credit)) {
				credit = data.path("copyright").asText("");
			}
			apod.setCredit(plainText(credit));
			apod.setTitle(plainText(apod.getTitle()));
			apod.setExplanation(cleanup(apod.getExplanation()));
			return apod;
		}
		catch (JacksonException e) {
			throw new IOException("Invalid NASA API response for " + requestedDate, e);
		}
	}

	private static String plainText(String html) {
		return html == null ? null : Jsoup.parseBodyFragment(html).text();
	}

	private String downloadAndOptimize(String date, String url, boolean hd) {
		try {
			Path dayPath = getFileName(date, url);
			Path imgFile = this.imageDirectory.resolve(dayPath);
			download(imgFile, url);
			if (Files.exists(imgFile)) {
				String fileName = imgFile.getFileName().toString();

				if (isJpegFileName(fileName)) {
					int pos = fileName.lastIndexOf(".");
					if (pos != -1) {
						Path out = imgFile.resolveSibling(fileName.substring(0, pos) + "_o" + fileName.substring(pos));
						try {
							if (hd) {
								optimizeJpegs(imgFile, out);
							}
							else {
								out = imgFile
									.resolveSibling(fileName.substring(0, pos) + "_oo" + fileName.substring(pos));
								optimizeJpegsLowQuality(imgFile, out);
							}
						}
						catch (InterruptedException | IOException e) {
							Application.logger.error("optimize", e);
						}
					}
				}

				return fileName;
			}
		}
		catch (IOException e) {
			Application.logger.error("downloadAndOptimize", e);
		}

		return null;
	}

	private static Path getFileName(String date, String url) {
		LocalDate ld = LocalDate.parse(date);
		int month = ld.getMonth().getValue();
		int day = ld.getDayOfMonth();

		String monthStr = (month < 10 ? "0" : "") + month;
		String dayStr = (day < 10 ? "0" : "") + day;
		Path dayPath = Paths.get(String.valueOf(ld.getYear()), monthStr, dayStr);

		return dayPath.resolve(extractFileName(url));
	}

	private static String extractFileName(String url) {
		try {
			URI uri = URI.create(url);
			String path = uri.getPath();
			if (StringUtils.hasText(path)) {
				return Paths.get(path.replace('\\', '/')).getFileName().toString();
			}
		}
		catch (IllegalArgumentException e) {
			// Fall back to string parsing below for malformed but still fetchable URLs.
		}

		int queryPos = url.indexOf('?');
		String withoutQuery = queryPos == -1 ? url : url.substring(0, queryPos);
		int fragmentPos = withoutQuery.indexOf('#');
		String withoutFragment = fragmentPos == -1 ? withoutQuery : withoutQuery.substring(0, fragmentPos);
		return Paths.get(withoutFragment.replace('\\', '/')).getFileName().toString();
	}

	private static boolean isJpegFileName(String fileName) {
		String lowerFileName = fileName.toLowerCase(Locale.ROOT);
		return lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg");
	}

	private static boolean isJpegUrl(String url) {
		return StringUtils.hasText(url) && isJpegFileName(extractFileName(url));
	}

	private void download(Path file, String url) throws IOException {
		if (Files.exists(file)) {
			return;
		}

		Files.createDirectories(file.getParent());

		Request request = new Request.Builder().url(url).header("Accept", "image/jpeg").build();
		try (Response response = this.httpClient.newCall(request).execute()) {
			if (response.isSuccessful()) {
				try (ResponseBody body = response.body()) {
					if (body != null) {
						byte[] image = body.bytes();
						if (image.length < 3 || image[0] != (byte) 0xff || image[1] != (byte) 0xd8
								|| image[2] != (byte) 0xff) {
							throw new IOException("Expected JPEG image from " + url);
						}
						Files.write(file, image);
					}
				}
			}
			else {
				Application.logger.warn("download: HTTP {} {} for {}", response.code(), response.message(), url);
			}
		}
	}

	private void optimizeJpegs(Path in, Path out) throws IOException, InterruptedException {
		if (Files.exists(out)) {
			return;
		}

		Process p = new ProcessBuilder(this.appProperties.getJpegRecompressExe(), "-c", "--accurate", "--strip",
				in.toString(), out.toString())
			.start();
		int exitCode = p.waitFor();
		if (exitCode == 1) {
			// Output would be larger than input — keep original, discard optimized
			// version
			Application.logger.info("optimizeJpegs: skipping optimization for {} (output would be larger)", in);
			Files.deleteIfExists(out);
		}
		else if (exitCode != 0) {
			throw new IOException("jpeg-recompress failed with exit code " + exitCode + " for " + in);
		}
	}

	private void optimizeJpegsLowQuality(Path in, Path out) throws IOException, InterruptedException {
		if (Files.exists(out)) {
			return;
		}

		Process p = new ProcessBuilder(this.appProperties.getJpegRecompressExe(), "-c", "-s", "-q", "low", "-t", ".97",
				in.toString(), out.toString())
			.start();
		int exitCode = p.waitFor();
		if (exitCode == 1) {
			// Output would be larger than input — keep original, discard optimized
			// version
			Application.logger.info("optimizeJpegsLowQuality: skipping optimization for {} (output would be larger)",
					in);
			Files.deleteIfExists(out);
		}
		else if (exitCode != 0) {
			throw new IOException("jpeg-recompress failed with exit code " + exitCode + " for " + in);
		}
	}

	public void recompress(Apod apod, String url) {
		Path dayPath = getFileName(apod.getDate(), url);
		Path imgFile = this.imageDirectory.resolve(dayPath);

		if (Files.exists(imgFile)) {
			String fileName = imgFile.getFileName().toString();

			if (isJpegFileName(fileName)) {
				int pos = fileName.lastIndexOf(".");
				if (pos != -1) {
					Path out = imgFile.resolveSibling(fileName.substring(0, pos) + "_oo" + fileName.substring(pos));
					try {
						optimizeJpegsLowQuality(imgFile, out);
					}
					catch (InterruptedException | IOException e) {
						Application.logger.error("optimize", e);
					}
				}
			}
		}

	}

	public boolean isJpeg(Apod apod) {
		return isJpegUrl(apod.getUrl()) || isJpegUrl(apod.getHdUrl());
	}

	public void deleteApod(Apod apod) throws IOException {
		LocalDate ld = LocalDate.parse(apod.getDate());
		int month = ld.getMonth().getValue();
		int day = ld.getDayOfMonth();

		String monthStr = (month < 10 ? "0" : "") + month;
		String dayStr = (day < 10 ? "0" : "") + day;
		Path dayPath = Paths.get(String.valueOf(ld.getYear()), monthStr, dayStr);

		Path dir = this.imageDirectory.resolve(dayPath);
		if (Files.exists(dir)) {
			try (var paths = Files.walk(dir)) {
				paths.sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(file -> {
					if (!file.delete()) {
						Application.logger.warn("Could not delete {}", file);
					}
				});
			}
		}

		this.exodusManager.deleteApod(apod);
	}

	public static String cleanup(String explanation) {
		if (explanation == null) {
			return null;
		}

		String expl = plainText(explanation).replaceFirst("(?i)^Explanation:\\s*", "");
		List<String> obsoleteTexts = Arrays.asList("Free APOD Lectur", "Free Download:", "Note: Free", "Free Lecture",
				"No Textbook:", "Happy Holidays:", "Print or Peruse:", "If Time Continues:", "Budget Universe:",
				"Downloadable Universe:", "Organize Your Universe:", "News: ", "Best Space Images", "Free Download",
				"Free Present", "Free Presentation", "    Free", "See for yourself:", "Follow APOD on", "Poll:",
				"Now Available:", ".   Students", "digg_url", ".    ", "APOD's email for image submissions",
				"APOD's main NASA site", "Tomorrow's picture:");
		for (String ob : obsoleteTexts) {
			int pos = expl.toLowerCase(Locale.ROOT).indexOf(ob.toLowerCase(Locale.ROOT));
			if (pos > -1) {
				expl = expl.substring(0, pos);
			}
		}

		return expl.trim();
	}

}
