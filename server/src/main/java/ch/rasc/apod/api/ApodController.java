package ch.rasc.apod.api;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.apod.ApodOuterClass.Apod.Builder;
import ch.rasc.apod.ApodOuterClass.Apods;
import ch.rasc.apod.ExodusManager;
import ch.rasc.apod.entity.Apod;

@RestController
@CrossOrigin
public class ApodController {

	private final static DateTimeFormatter longFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");

	private final ExodusManager exodusManager;

	public ApodController(ExodusManager exodusManager) {
		this.exodusManager = exodusManager;
	}

	@GetMapping("/apods")
	public Apods getApods(@RequestParam(name = "from", required = false) String fromDate) {
		List<Apod> apods;
		if (fromDate == null) {
			apods = this.exodusManager.readAllApod();
		}
		else {
			LocalDate ld = LocalDate.parse(fromDate);
			ld = ld.plusDays(1);
			apods = this.exodusManager.readApodFrom(ld.format(longFormat));
		}

		List<ch.rasc.apod.ApodOuterClass.Apod> protoApods = apods.stream().map(a -> {
			Builder newBuilder = ch.rasc.apod.ApodOuterClass.Apod.newBuilder();
			if (a.getCredit() != null) {
				newBuilder.setCredit(a.getCredit());
			}
			return newBuilder.setDate(a.getDate()).setExplanation(a.getExplanation()).setTitle(a.getTitle()).build();
		}).collect(Collectors.toList());

		return Apods.newBuilder().addAllApods(protoApods).build();
	}

}
