package ch.rasc.apod;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import ch.rasc.apod.entity.Apod;

@Component
public class CliRunner implements ApplicationRunner {

	private final Importer importer;

	private final ApplicationContext appContext;

	private final ExodusManager exodusManager;

	public CliRunner(Importer importer, ApplicationContext appContext,
			ExodusManager exodusManager) {
		this.importer = importer;
		this.appContext = appContext;
		this.exodusManager = exodusManager;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		if (args.getNonOptionArgs().contains("importall")) {
			Application.runJobs = false;

			LocalDate c = LocalDate.now();

			int counter = 0;
			for (int i = 0; i < 9000; i++) {
				try {
					boolean ok = this.importer.importData(c);
					if (ok) {
						counter++;
					}
				}
				catch (IOException e) {
					Application.logger.info(e.getMessage());
				}
				c = c.minusDays(1);

				if (counter > 900) {
					TimeUnit.MINUTES.sleep(65);
					counter = 0;
				}
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("exportcredit")) {
			Application.runJobs = false;

			List<String> fileNames = args.getOptionValues("file");
			if (fileNames.size() == 1) {
				Path export = Paths.get(fileNames.get(0));
				List<Apod> allApods = this.exodusManager.readAllApod();
				List<String> lines = new ArrayList<>();
				for (Apod apod : allApods) {
					String credit = apod.getCredit();
					if (credit != null) {
						credit = credit.replace("\r", "").replace("\n", "").trim();
						lines.add(apod.getDate() + ";" + credit);
					}
				}
				Files.write(export, lines);
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("exporturl")) {
			Application.runJobs = false;

			List<String> fileNames = args.getOptionValues("file");
			if (fileNames.size() == 1) {
				Path export = Paths.get(fileNames.get(0));
				List<Apod> allApods = this.exodusManager.readAllApod();
				List<String> lines = new ArrayList<>();
				for (Apod apod : allApods) {

					lines.add(apod.getDate() + ";" + apod.getUrl() + ";" + apod.getHdUrl());
				}
				Files.write(export, lines);
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("exportexplanation")) {
			Application.runJobs = false;

			List<String> fileNames = args.getOptionValues("file");
			if (fileNames.size() == 1) {
				Path export = Paths.get(fileNames.get(0));
				List<Apod> allApods = this.exodusManager.readAllApod();
				List<String> lines = new ArrayList<>();
				for (Apod apod : allApods) {
					String explanation = apod.getExplanation();
					if (explanation != null) {
						lines.add(apod.getDate() + ";" + explanation);
					}
				}
				Files.write(export, lines);
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("cleanupexplanation")) {
			Application.runJobs = false;

			List<Apod> allApods = this.exodusManager.readAllApod();
			for (Apod apod : allApods) {
				String explanation = apod.getExplanation();
				if (explanation != null) {
					String newExplanation = Importer.cleanup(explanation);
					if (!newExplanation.equals(explanation)) {
						apod.setExplanation(newExplanation);
						this.exodusManager.saveApod(apod);
					}

				}
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("importcredit")) {
			Application.runJobs = false;

			List<String> fileNames = args.getOptionValues("file");
			if (fileNames.size() == 1) {
				Path export = Paths.get(fileNames.get(0));

				List<String> lines = Files.readAllLines(export);
				for (String line : lines) {
					int pos = line.indexOf(";");
					String key = line.substring(0, pos);
					String readCredit = line.substring(pos + 1);
					Apod apod = this.exodusManager.readApod(key);
					if (StringUtils.hasText(readCredit)) {
						if (apod != null && !apod.getCredit().equals(readCredit)) {
							apod.setCredit(readCredit);
							this.exodusManager.saveApod(apod);
						}
					}
					else {
						if (apod != null) {
							apod.setCredit(null);
							this.exodusManager.saveApod(apod);
						}
					}
				}

				List<Apod> allApods = this.exodusManager.readAllApod();
				for (Apod apod : allApods) {
					String credit = apod.getCredit();
					if (credit != null && credit.contains("About APOD")) {
						apod.setCredit(null);
						this.exodusManager.saveApod(apod);
					}
				}

			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("delnonimages")) {
			Application.runJobs = false;
			List<Apod> allApods = this.exodusManager.readAllApod();
			for (Apod apod : allApods) {
				if (!"image".equals(apod.getMediaType())) {
					this.exodusManager.deleteApod(apod);
					System.out.println(apod.getDate());
				}
			}
			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("deldate")) {
			Application.runJobs = false;
			
			List<String> date = args.getOptionValues("date");
			if (date.size() == 1) {
				String key = date.get(0);
				Apod apod = this.exodusManager.readApod(key);
				if (apod != null) {
					this.exodusManager.deleteApod(apod);
				}
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}		
		else if (args.getNonOptionArgs().contains("fixurls")) {
			Application.runJobs = false;
			List<Apod> allApods = this.exodusManager.readAllApod();
			for (Apod apod : allApods) {
				if (apod.getUrl() != null && apod.getUrl().startsWith("https://")) {
					apod.setUrl(null);
					this.exodusManager.saveApod(apod);
				}
				if (apod.getHdUrl() != null && apod.getHdUrl().startsWith("https://")) {
					apod.setHdUrl(null);
					this.exodusManager.saveApod(apod);
				}
			}
			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("fixtitles")) {
			Application.runJobs = false;

			List<Apod> allApods = this.exodusManager.readAllApod();
			for (Apod apod : allApods) {
				String title = apod.getTitle();
				if (title != null) {
					apod.setTitle(title.replace("\r", "").replace("\n", "").trim());
					this.exodusManager.saveApod(apod);
				}
			}

			SpringApplication.exit(this.appContext, () -> 0);
		}
		else if (args.getNonOptionArgs().contains("recompress")) {
			Application.runJobs = false;
			List<Apod> allApods = this.exodusManager.readAllApod();
			for (Apod apod : allApods) {
				if (!this.importer.isJpeg(apod)) {
					if (apod.getDate().compareTo("2016-01-01") > 0) {
						try {
							this.importer.deleteApod(apod);
						}
						catch (IOException e) {
							Application.logger.info(e.getMessage());
						}
					}
				}
				else {
					if (apod.getUrl() != null) {
						this.importer.recompress(apod, apod.getUrl());
					}
					else if (apod.getHdUrl() != null) {
						this.importer.recompress(apod, apod.getHdUrl());
					}
				}
			}
			SpringApplication.exit(this.appContext, () -> 0);
		}

	}

}
