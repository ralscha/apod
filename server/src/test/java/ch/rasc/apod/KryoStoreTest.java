package ch.rasc.apod;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import ch.rasc.apod.config.AppPaths;
import ch.rasc.apod.config.AppProperties;
import ch.rasc.apod.entity.Apod;

class KryoStoreTest {

	@TempDir
	Path directory;

	private AppProperties properties;

	private ExodusManager database;

	@BeforeEach
	void setUp() {
		this.properties = new AppProperties();
		this.properties.setXodusPath(this.directory.resolve("database").toString());
		this.database = new ExodusManager(this.properties, new AppPaths());
	}

	@AfterEach
	void closeDatabase() {
		if (this.database != null) {
			this.database.destroy();
		}
	}

	private static Apod sample(String date) {
		Apod value = new Apod();
		value.setDate(date);
		value.setExplanation("A star — 星 🌟");
		value.setMediaType("image");
		value.setTitle("Repeated");
		value.setUrl("https://example.com/" + date + ".jpg");
		value.setCredit("Repeated");
		return value;
	}

	@Test
	void readApodPreservesUnicodeAndNullFields() {
		this.database.saveApod(sample("2026-10-25"));

		Apod actual = this.database.readApod("2026-10-25");

		assertEquals("2026-10-25", actual.getDate());
		assertEquals("A star — 星 🌟", actual.getExplanation());
		assertEquals("image", actual.getMediaType());
		assertEquals("Repeated", actual.getTitle());
		assertEquals("https://example.com/2026-10-25.jpg", actual.getUrl());
		assertEquals("Repeated", actual.getCredit());
		assertNull(actual.getHdUrl());
	}

	@Test
	void keepsRecordsOrderedByDateAndSupportsRangedReads() {
		this.database.saveApod(sample("2026-10-25"));
		this.database.saveApod(sample("2026-10-23"));

		assertEquals(List.of("2026-10-23", "2026-10-25"),
				this.database.readAllApod().stream().map(Apod::getDate).toList());
		assertEquals(List.of("2026-10-25"),
				this.database.readApodFrom("2026-10-24").stream().map(Apod::getDate).toList());
	}

	@Test
	void deleteApodRemovesOnlyTheGivenRecord() {
		this.database.saveApod(sample("2026-10-24"));
		this.database.saveApod(sample("2026-10-25"));

		this.database.deleteApod(sample("2026-10-24"));

		assertNull(this.database.readApod("2026-10-24"));
		assertEquals("2026-10-25", this.database.readApod("2026-10-25").getDate());
	}

	@Test
	void recordsSurviveAnApplicationRestart() {
		this.database.saveApod(sample("2026-10-25"));
		this.database.destroy();

		this.database = new ExodusManager(this.properties, new AppPaths());

		assertEquals("2026-10-25", this.database.readApod("2026-10-25").getDate());
	}

}
