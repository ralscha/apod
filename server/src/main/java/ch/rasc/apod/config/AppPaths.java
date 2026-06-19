package ch.rasc.apod.config;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.boot.system.ApplicationHome;
import org.springframework.stereotype.Component;

import ch.rasc.apod.Application;

@Component
public class AppPaths {

	private final Path applicationDirectory;

	public AppPaths() {
		File source = new ApplicationHome(Application.class).getSource();
		if (source != null && source.isFile()) {
			this.applicationDirectory = source.getParentFile().toPath();
		}
		else {
			this.applicationDirectory = Paths.get("").toAbsolutePath();
		}
	}

	public Path resolve(String configuredPath) {
		Path path = Paths.get(configuredPath);
		if (path.isAbsolute()) {
			return path;
		}
		return this.applicationDirectory.resolve(path).normalize();
	}

}
