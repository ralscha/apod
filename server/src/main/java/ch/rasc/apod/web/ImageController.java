package ch.rasc.apod.web;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import ch.rasc.apod.ExodusManager;
import ch.rasc.apod.config.AppProperties;
import ch.rasc.apod.entity.Apod;

@Controller
public class ImageController {

	private final AppProperties appProperties;

	private final ExodusManager exodusManager;

	private final Path imageDirectory;

	@Autowired
	public ImageController(AppProperties appProperties, ExodusManager exodusManager) {
		this.appProperties = appProperties;
		this.exodusManager = exodusManager;
		this.imageDirectory = Paths.get(appProperties.getImagesPath());
	}

	@RequestMapping(value = "/img/{date}/{format}", method = RequestMethod.GET)
	public void download(@PathVariable(value = "date", required = true) String date,
			@PathVariable(value = "format", required = true) String format, HttpServletResponse response)
			throws IOException {

		Apod apod = this.exodusManager.readApod(date);

		if (apod != null) {
			String url = apod.getUrl();
			if (url == null || "hd".equals(format) && StringUtils.hasText(apod.getHdUrl())) {
				url = apod.getHdUrl();
			}

			if (url != null) {
				Path imgPath = getFileName(apod.getDate(), url, !"hd".equals(format));

				if (Files.exists(imgPath)) {
					String contentType = Files.probeContentType(imgPath);
					response.setContentType(contentType);

					if (StringUtils.hasText(this.appProperties.getRedirDir())) {
						response.sendRedirect(getNginxRedirect(date, imgPath.getFileName().toString()));
						return;
					}

					long fileSize = Files.size(imgPath);
					response.setStatus(HttpServletResponse.SC_OK);
					response.setContentLengthLong(fileSize);
					try (OutputStream out = response.getOutputStream()) {
						Files.copy(imgPath, out);
					}
					return;

				}
			}
		}

		response.setStatus(HttpServletResponse.SC_NOT_FOUND);
	}

	private Path getFileName(String date, String fileName, boolean lowQuality) {
		LocalDate ld = LocalDate.parse(date);
		int month = ld.getMonth().getValue();
		int day = ld.getDayOfMonth();

		String monthStr = (month < 10 ? "0" : "") + month;
		String dayStr = (day < 10 ? "0" : "") + day;
		Path datePath = Paths.get(String.valueOf(ld.getYear()), monthStr, dayStr);

		Path imgFile = this.imageDirectory.resolve(datePath.resolve(fileName));
		int pos = fileName.lastIndexOf(".");
		if (pos != -1) {
			Path optimizedFile = null;
			if (lowQuality) {
				optimizedFile = imgFile.resolveSibling(fileName.substring(0, pos) + "_oo" + fileName.substring(pos));
			}
			if (optimizedFile != null && Files.exists(optimizedFile)) {
				return optimizedFile;
			}

			optimizedFile = imgFile.resolveSibling(fileName.substring(0, pos) + "_o" + fileName.substring(pos));
			if (Files.exists(optimizedFile)) {
				return optimizedFile;
			}
		}

		return imgFile;
	}

	private String getNginxRedirect(String date, String fileName) {
		LocalDate ld = LocalDate.parse(date);
		int month = ld.getMonth().getValue();
		int day = ld.getDayOfMonth();

		String monthStr = (month < 10 ? "0" : "") + month;
		String dayStr = (day < 10 ? "0" : "") + day;
		return this.appProperties.getRedirDir() + "/" + ld.getYear() + "/" + monthStr + "/" + dayStr + "/" + fileName;
	}

}