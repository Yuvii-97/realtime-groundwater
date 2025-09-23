package com.example.backend.config;

import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
@Profile("dev") // dev only
public class RestTemplateConfig {

  @Bean
  public RestTemplate restTemplate() throws Exception {
    // Trust-all SSL context (dev only!)
    TrustManager[] trustAll = new TrustManager[] {
      new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] chain, String authType) {}
        public void checkServerTrusted(X509Certificate[] chain, String authType) {}
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
      }
    };

    SSLContext sc = SSLContext.getInstance("TLS");
    sc.init(null, trustAll, new SecureRandom());
    // set default so HttpsURLConnection used by SimpleClientHttpRequestFactory trusts
    SSLContext.setDefault(sc);

    // Accept any host name (dev only)
    HostnameVerifier allHostsValid = new HostnameVerifier() {
      @Override
      public boolean verify(String hostname, SSLSession session) { return true; }
    };
    HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);

    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    // optionally set timeouts
    factory.setConnectTimeout(15_000);
    factory.setReadTimeout(30_000);

    return new RestTemplate(factory);
  }
}
