package ch.rasc.apod;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Application {

	public static final Logger logger = LoggerFactory.getLogger(Application.class);

	public static boolean runJobs = true;

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
