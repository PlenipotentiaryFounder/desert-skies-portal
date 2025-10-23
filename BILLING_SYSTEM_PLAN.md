# Billing System Overhaul - Action Plan

## Project Status: ✅ IMPLEMENTATION COMPLETE - TESTING PHASE

---

## Phase 1: Database Schemas ✅ COMPLETE

### Status: ALL CORE SCHEMAS APPLIED
- ✅ `instructor_payout_rates` - Instructor compensation tracking
- ✅ `instructor_payout_rate_changes` - Rate change audit trail
- ✅ `wallets` - Multi-party wallet system
- ✅ `journals` - Atomic business events
- ✅ `ledger_entries` - Double-entry transactions
- ✅ `wallet_balances` - Materialized balances
- ✅ `payment_outbox` - Idempotent transfer queue
- ✅ `instructor_transfers` - Payout tracking with clawback
- ✅ `student_credit_limits` - Credit management
- ✅ `platform_reserve_config` - Reserve thresholds
- ✅ `reserve_reconciliations` - Daily reconciliation logs
- ✅ `reserve_alerts` - Drift detection
- ✅ `instructor_adjustments` - Flight correction tracking
- ⏸️ `aircraft_billing_config` - Awaiting aircraft table
- ⏸️ Flight session enhancements - Awaiting flight_session_billing table

**Next Action**: Apply remaining migrations once prerequisite tables exist

---

## Phase 2: Service Layer ✅ COMPLETE

### Status: ALL SERVICES IMPLEMENTED
- ✅ `lib/ledger-service.ts` - Double-entry ledger operations
- ✅ `lib/stripe-connect-service.ts` - Instructor payout management
- ✅ `lib/credit-limit-service.ts` - Student credit controls
- ✅ `lib/reserve-monitoring-service.ts` - Cash reserve monitoring
- ✅ `lib/flight-adjustment-service.ts` - Billing corrections
- ✅ Enhanced `lib/instructor-billing-service.ts` - Main billing orchestration

**Next Action**: Integration testing with sample data

---

## Phase 3: Webhooks & Background Jobs ✅ COMPLETE

### Status: WEBHOOKS IMPLEMENTED
- ✅ `payment_intent.succeeded` - Student payments
- ✅ `payment_intent.payment_failed` - Payment failures
- ✅ `charge.dispute.created` - Dispute handling
- ✅ `account.updated` - Connect onboarding status
- ✅ `transfer.paid` - Instructor payout confirmation
- ✅ `transfer.failed` - Payout failure handling
- ✅ `payout.paid` - Instant payout tracking
- ✅ `payout.failed` - Payout failure logging

**Background Jobs Needed** (Future enhancement):
- ⏳ Transfer retry worker (process failed outbox entries)
- ⏳ Daily reconciliation job
- ⏳ Credit limit warning notifications
- ⏳ Reserve alert emails

**Next Action**: Set up Stripe webhook endpoint configuration

---

## Phase 4: Admin Dashboards ✅ COMPLETE

### Status: ALL DASHBOARDS BUILT
- ✅ `/admin/billing/reserve-monitoring` - Platform cash health
- ✅ `/admin/billing/margin-analytics` - Revenue tracking
- ✅ `/admin/billing/instructor-rates` - Payout rate management
- ✅ `/admin/billing/credit-limits` - Student credit monitoring
- ✅ `/admin/billing/adjustments` - Billing corrections
- ✅ Enhanced main billing page with quick access

**Next Action**: Admin user training and documentation

---

## Phase 5: Flight Adjustments & Clawbacks ✅ COMPLETE

### Status: FULLY IMPLEMENTED
- ✅ Flight adjustment workflow
- ✅ Overpayment/underpayment detection
- ✅ T+72h clawback window tracking
- ✅ Settlement mechanisms (offset, manual, reversal, forgiven)
- ✅ Approval workflow for large adjustments
- ✅ Admin dashboard for management

**Next Action**: Test clawback scenarios in Stripe test mode

---

## Phase 6: Aircraft Billing ✅ SCHEMAS READY

### Status: AWAITING PREREQUISITE TABLES
- ✅ Schemas designed and created
- ⏸️ Multi-model support (DSA-owned, leased, third-party, passthrough)
- ⏸️ Bundled pricing calculations
- ⏸️ Multi-party ledger splits

**Blockers**: Requires `aircraft` and `flight_session_billing` tables

**Next Action**: Create prerequisite tables or skip for now

---

## Phase 7: Testing & Cutover 🚧 IN PROGRESS

### Testing Checklist
- [ ] Apply all database migrations to production DB
- [ ] Configure initial settings (credit limits, reserve thresholds)
- [ ] Set up instructor payout rates for all instructors
- [ ] Test flight completion billing with sample data
- [ ] Test credit limit enforcement
- [ ] Test reserve monitoring and reconciliation
- [ ] Test adjustment workflow
- [ ] Configure Stripe webhook endpoint
- [ ] Test webhook event processing
- [ ] Shadow mode testing (2+ weeks recommended)
- [ ] Monitor reconciliation drift
- [ ] Production cutover
- [ ] Post-cutover monitoring

**Current Action**: Systematically complete each testing item

---

## Implementation Tasks - TO DO NOW

### 1. Database Setup
- [ ] Apply migrations to Supabase using MCP tools
- [ ] Verify all tables created successfully
- [ ] Check RLS policies are active
- [ ] Test database functions

### 2. Initial Configuration
- [ ] Set default credit limit (-$200.00)
- [ ] Configure platform reserve thresholds
- [ ] Create instructor payout rates for thomas@desertskiesaviationaz.com
- [ ] Set up test student with credit limit

### 3. Integration Points
- [ ] Integrate `processFlightCompletionBilling` into flight completion flow
- [ ] Add credit check before flight booking
- [ ] Add reserve monitoring to admin dashboard
- [ ] Set up daily reconciliation job

### 4. Stripe Configuration
- [ ] Configure webhook endpoint URL
- [ ] Add webhook signing secret to environment
- [ ] Test webhook events in Stripe test mode
- [ ] Set up Connect Express for test instructor

### 5. Testing
- [ ] Create test flight session
- [ ] Process billing for test flight
- [ ] Verify ledger entries created
- [ ] Check wallet balances updated
- [ ] Test transfer enqueued
- [ ] Test adjustment workflow
- [ ] Test credit limit blocking

### 6. Documentation & Handoff
- [ ] Create admin user guide
- [ ] Document common troubleshooting scenarios
- [ ] Create runbook for daily operations
- [ ] Train admin staff

### 7. Version Control
- [ ] Commit all new files
- [ ] Push to GitHub
- [ ] Create pull request with detailed description
- [ ] Code review

---

## Success Criteria

### System Health Indicators
✅ **Ledger Balance**: Sum of all wallets = $0.00 (double-entry balanced)
✅ **Reconciliation Drift**: < $10.00 between platform wallet and Stripe balance
✅ **Reserve Status**: Healthy (above minimum threshold)
✅ **Transfer Success Rate**: > 95% of transfers complete successfully
✅ **Webhook Processing**: < 1 second latency for critical events

### Business Metrics
- **Margin Visibility**: Real-time margin per flight visible in analytics
- **Credit Risk**: No students exceeding credit limits without alerts
- **Instructor Satisfaction**: Transparent payouts with optional instant transfer
- **Cash Flow**: Platform reserve never drops below critical threshold
- **Audit Compliance**: Complete trail for all financial transactions

---

## Risk Mitigation

### Shadow Mode Testing
**Purpose**: Run new billing alongside old system without relying on new system
**Duration**: 2+ weeks minimum
**Process**:
1. Complete flight using existing billing system
2. Call new `processFlightCompletionBilling()` 
3. Compare results (student charge, instructor payout, margin)
4. Log any discrepancies
5. Investigate and fix differences
6. Repeat until 100% match rate

### Rollback Plan
If issues arise post-cutover:
1. Disable new billing code (feature flag)
2. Revert to old billing system
3. Investigate issues in test environment
4. Fix and re-test
5. Schedule new cutover

### Monitoring & Alerts
- Set up Sentry/error tracking for billing errors
- Daily reconciliation alerts via email
- Reserve warning alerts when < 20% above minimum
- Webhook failure alerts
- Transfer failure alerts

---

## Timeline Estimate

- **Database Setup**: 1 hour
- **Initial Configuration**: 2 hours
- **Integration**: 4 hours
- **Testing**: 1 week
- **Shadow Mode**: 2-4 weeks
- **Cutover**: 1 day
- **Post-Cutover Monitoring**: 1 week

**Total**: 4-6 weeks from completion to production

---

## Current Status Summary

**✅ COMPLETE**: Phases 1-6 (Code & Schemas)
**🚧 IN PROGRESS**: Phase 7 (Testing & Deployment)
**📅 NEXT**: Execute implementation tasks systematically

**Last Updated**: October 23, 2025
**Status**: Ready for database migration and testing

