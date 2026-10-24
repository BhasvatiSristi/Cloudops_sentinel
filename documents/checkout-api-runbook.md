# Checkout API Incident Response Guide

## Service Overview

The Checkout API handles checkout requests from the web application and integrates with the Payment Gateway, Inventory Service, Redis session cache, and PostgreSQL Orders database. Incoming production requests pass through the public load balancer before reaching the `checkout-api` Kubernetes deployment.

## Incident: HTTP 502 Responses

Use this procedure when HTTP 502 errors appear immediately after a deployment.

### Initial Investigation

1. Record when the errors began and compare the timestamp with the most recent deployment.
2. Inspect the Kubernetes deployment status and the health of all `checkout-api` pods.
3. Review readiness-probe results before considering any pod restart. Pods that fail readiness checks must not receive production traffic.
4. Examine recent application logs for startup failures, dependency errors, and configuration problems.
5. Confirm that all required environment variables and secrets are correctly configured in the new release.
6. Test connectivity from the Checkout API to the Payment Gateway and PostgreSQL Orders database.

### Recovery Decision

If the new release is strongly associated with the incident and the error rate remains above **5% for five minutes**, roll back to the last known healthy image using the approved deployment rollback procedure.

Avoid repeatedly deleting pods as an initial troubleshooting step. Preserve application logs and Kubernetes events so the underlying cause can be investigated.

## Escalation Guidelines

- **Platform team:** Escalate when the load balancer cannot reach healthy Checkout API pods despite successful readiness checks.
- **Database team:** Escalate when database connection-pool errors persist after the application has been rolled back.

## Operational Reminder

Prioritize identifying the cause of the incident before restarting or replacing resources. Preserve diagnostic evidence throughout the recovery process.