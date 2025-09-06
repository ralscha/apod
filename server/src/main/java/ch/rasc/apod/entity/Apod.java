package ch.rasc.apod.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class Apod {

	private String date;

	private String explanation;

	@JsonProperty("hdurl")
	private String hdUrl;

	@JsonProperty("media_type")
	private String mediaType;

	private String title;

	private String url;

	private String credit;

	public String getDate() {
		return this.date;
	}

	public void setDate(String date) {
		this.date = date;
	}

	public String getExplanation() {
		return this.explanation;
	}

	public void setExplanation(String explanation) {
		this.explanation = explanation;
	}

	public String getHdUrl() {
		return this.hdUrl;
	}

	public void setHdUrl(String hdUrl) {
		this.hdUrl = hdUrl;
	}

	public String getMediaType() {
		return this.mediaType;
	}

	public void setMediaType(String mediaType) {
		this.mediaType = mediaType;
	}

	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getUrl() {
		return this.url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getCredit() {
		return this.credit;
	}

	public void setCredit(String credit) {
		this.credit = credit;
	}

	@Override
	public String toString() {
		return "Apod [date=" + this.date + ", explanation=" + this.explanation + ", hdUrl=" + this.hdUrl
				+ ", mediaType=" + this.mediaType + ", title=" + this.title + ", url=" + this.url + ", credit="
				+ this.credit + "]";
	}

}
