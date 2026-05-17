package com.crm.config;

import com.crm.model.User;
import com.crm.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * First-run setup: creates default admin when no ADMIN user exists.
 */
@Component
@Profile("desktop")
public class DesktopStartupInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DesktopStartupInitializer.class);

    private final UserRepository userRepository;

    @Value("${crm.desktop.default-admin.username:admin}")
    private String defaultUsername;

    @Value("${crm.desktop.default-admin.password:admin123}")
    private String defaultPassword;

    public DesktopStartupInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        long adminCount = userRepository.countByRole("ADMIN");
        if (adminCount > 0) {
            log.info("Desktop database ready ({} admin account(s))", adminCount);
            return;
        }

        User admin = new User();
        admin.setUsername(defaultUsername);
        admin.setPassword(defaultPassword);
        admin.setRole("ADMIN");
        admin.setApproved(true);
        admin.setName("Administrator");
        admin.setEmail("admin@crm.local");
        admin.setPhone("0000000000");
        admin.setDepartment("System");
        admin.setDesignation("Administrator");

        userRepository.save(admin);
        log.warn(
                "Created default desktop admin user '{}' — change password after first login",
                defaultUsername);
    }
}
