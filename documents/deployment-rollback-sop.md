# Release Recovery and Rollback Procedure

## Purpose

Rollback may be necessary when a newly deployed application version is strongly linked to a regression affecting customers and a safe configuration change cannot restore service more quickly.

## 1. Pre-Rollback Checklist

Complete the following checks before initiating a rollback:

- [ ] Identify the version or image currently running in production.
- [ ] Confirm the last known healthy application version.
- [ ] Capture relevant application logs and Kubernetes events, along with dashboard screenshots.
- [ ] Notify the team through the incident communication channel.
- [ ] Verify that database migrations remain backward-compatible with the application version being restored.

Do not proceed until the compatibility of the previous application version with the current database state has been considered.

## 2. Execute the Rollback

1. Use the deployment platform's approved rollback mechanism.
2. Restore the last known healthy application image.
3. Avoid manually modifying production containers.
4. Observe the deployment until the restored version is ready to serve traffic.

## 3. Validate Service Recovery

After the rollback, verify the following:

- Application readiness checks are passing.
- The error rate has returned to an acceptable level.
- Application latency is stable.
- At least one business-level health check succeeds.
- Service metrics remain stable for **15 minutes**.

Keep the incident open until the stability period is complete and the recovery checks have passed.

## 4. Post-Incident Follow-Up

Preserve the incident evidence and document the deployment version, reason for rollback, validation results, and any remaining issues for subsequent investigation.

## Safety Requirements

Use only the approved production deployment and rollback mechanisms. Confirm database compatibility before restoring older application code, and do not manually modify production containers.