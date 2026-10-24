# Payments Performance and CPU Troubleshooting Guide

## When to Activate This Procedure

Start investigating when either of these conditions occurs:

- Average CPU utilization for the Payments service remains above **85% for 10 minutes**.
- Application latency increases alongside CPU saturation.

## 1. Diagnose the Cause

Follow these steps to identify the source of the performance issue.

1. **Check incoming traffic:** Determine whether request volume has increased beyond normal levels.
2. **Compare replicas:** Inspect CPU utilization across service replicas. A single overloaded replica may indicate a stuck worker or uneven traffic distribution.
3. **Review service metrics:** Examine latency, request rate, error rate, and queue depth before making scaling changes.
4. **Inspect recent changes:** Check recent deployments and feature-flag modifications for possible correlations.
5. **Analyze application logs:** Look for retry storms, repeated timeout loops, serialization errors, and unusually expensive requests.

## 2. Select the Recovery Action

### Option A: Increase Capacity

If the service is functioning correctly but available capacity is insufficient, scale the number of replicas within the approved production autoscaling limits.

Recheck CPU utilization, latency, and error rates after scaling.

### Option B: Roll Back a Faulty Release

If CPU saturation began immediately after a deployment and customer impact is increasing, follow the approved deployment rollback procedure instead of continuing to scale a potentially faulty release.

After rollback, verify that the service has recovered and that the relevant performance metrics are stable.

## 3. Validate Recovery

Confirm that CPU utilization, request latency, error rates, and queue depth are moving toward acceptable levels. Continue monitoring the service after the immediate incident has been addressed.

## Production Safety Requirements

Do not disable CPU limits or remove production resource controls during an incident without approval from the platform team.

All scaling and rollback actions must follow the approved production procedures.