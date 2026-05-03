package com.kotacorridor.service;

import com.kotacorridor.entity.AuditLog;
import com.kotacorridor.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, Long performedBy, String performedByEmail,
                    String targetEntity, Long targetId, String details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .performedBy(performedBy)
                .performedByEmail(performedByEmail)
                .targetEntity(targetEntity)
                .targetId(targetId)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
