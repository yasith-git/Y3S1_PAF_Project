package com.smartcampus.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileStorageService {
    /** Store an uploaded image and return the public URL path. */
    String store(MultipartFile file) throws IOException;

    /** Delete a stored file by its stored filename. */
    void delete(String storedName);
}
