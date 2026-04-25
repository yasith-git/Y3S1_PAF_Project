package com.smartcampus.service.impl;

import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_SIZE = 5 * 1024 * 1024L; // 5 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    @Value("${app.upload.dir:uploads/tickets}")
    private String uploadDir;

    private Path root;

    @PostConstruct
    public void init() {
        root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directory: " + root, e);
        }
    }

    @Override
    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Only image files (JPEG, PNG, WEBP, GIF) are allowed");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File size exceeds the 5 MB limit");
        }

        String original    = file.getOriginalFilename();
        String extension   = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";
        String storedName  = UUID.randomUUID() + extension;

        // Prevent path traversal
        Path target = root.resolve(storedName).normalize();
        if (!target.startsWith(root)) {
            throw new SecurityException("Invalid file path");
        }

        Files.copy(file.getInputStream(), target);
        return "/uploads/tickets/" + storedName;
    }

    @Override
    public void delete(String storedName) {
        if (storedName == null || storedName.isBlank()) return;
        try {
            // Strip URL prefix if present
            String fileName = storedName.replaceFirst("^.*?/uploads/tickets/", "");
            Path target = root.resolve(fileName).normalize();
            if (target.startsWith(root)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ignored) {
            // Best-effort deletion
        }
    }
}
