package com.crm.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.stream.Stream;

/**
 * Rolling SQLite backups on each successful backend start (desktop profile).
 */
@Component
@Profile("desktop")
public class DesktopDatabaseBackupService {

    private static final Logger log = LoggerFactory.getLogger(DesktopDatabaseBackupService.class);
    private static final int MAX_BACKUPS = 10;

    @Value("${CRM_DB_PATH}")
    private String dbPath;

    @Value("${CRM_USER_DATA}")
    private String userData;

    @EventListener(ApplicationReadyEvent.class)
    public void backupOnReady() {
        Path db = Path.of(dbPath);
        try {
            if (!Files.isRegularFile(db) || Files.size(db) == 0) {
                return;
            }
            Path backupDir = Path.of(userData, "backups");
            Files.createDirectories(backupDir);

            String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            Path target = backupDir.resolve("crm-desktop-" + stamp + ".db");
            Files.copy(db, target, StandardCopyOption.REPLACE_EXISTING);
            log.info("SQLite backup saved: {}", target);

            pruneOldBackups(backupDir);
        } catch (IOException e) {
            log.warn("Could not create SQLite backup: {}", e.getMessage());
        }
    }

    private void pruneOldBackups(Path backupDir) throws IOException {
        try (Stream<Path> files = Files.list(backupDir)) {
            files
                    .filter(p -> p.getFileName().toString().endsWith(".db"))
                    .sorted(Comparator.comparing(Path::toFile).reversed())
                    .skip(MAX_BACKUPS)
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {
                            /* best effort */
                        }
                    });
        }
    }
}
