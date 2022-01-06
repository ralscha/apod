package ch.rasc.apod.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@ConfigurationProperties(prefix = "app")
@Component
public class AppProperties {

	private String nasaApiKey;

	private String imagesPath;

	private String xodusPath;

	private String jpegRecompressExe;

	private String redirDir;

	public String getNasaApiKey() {
		return this.nasaApiKey;
	}

	public void setNasaApiKey(String nasaApiKey) {
		this.nasaApiKey = nasaApiKey;
	}

	public String getImagesPath() {
		return this.imagesPath;
	}

	public void setImagesPath(String imagesPath) {
		this.imagesPath = imagesPath;
	}

	public String getXodusPath() {
		return this.xodusPath;
	}

	public void setXodusPath(String xodusPath) {
		this.xodusPath = xodusPath;
	}

	public String getJpegRecompressExe() {
		return this.jpegRecompressExe;
	}

	public void setJpegRecompressExe(String jpegRecompressExe) {
		this.jpegRecompressExe = jpegRecompressExe;
	}

	public String getRedirDir() {
		return this.redirDir;
	}

	public void setRedirDir(String redirDir) {
		this.redirDir = redirDir;
	}

}
