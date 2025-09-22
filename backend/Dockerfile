# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:20-jdk-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy the Gradle/Maven build artifact (jar) into the container
# Make sure your Spring Boot jar is built already (./build/libs/*.jar or ./target/*.jar)
COPY build/libs/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose the port your Spring Boot app runs on (default 8080)
EXPOSE 8080

# Run the jar file
ENTRYPOINT ["java","-jar","app.jar"]
