# Service Type Checklist Tracker

11 service types total. Each needs Core items + Dementia sub-service items.

## Status

| # | Service Type | Migration file | Status |
|---|---|---|---|
| 1 | Residential Care Home | `20260714000001_reference_tables.sql` + `20260719000001_checklist_content_corrections.sql` | ✅ Done |
| 2 | Nursing Home | `20260714000001_reference_tables.sql` + corrections | ✅ Done |
| 3 | Dual-Registered Care Home | `20260719000007_dementia_nursing_and_dualreg.sql` | ✅ Done |
| 4 | ARBD Specialist Care Home | `20260719000003_arbd_checklist.sql` | ✅ Done |
| 5 | Homecare Agency | `20260719000008_homecare_agency.sql` | ✅ Done |
| 6 | Extra Care Housing | `20260719000009_extra_care_housing.sql` | ✅ Done |
| 7 | Shared Lives Scheme | `20260719000010_shared_lives_scheme.sql` | ✅ Done |
| 8 | Supported Living | `20260719000011_supported_living.sql` | ✅ Done |
| 9 | Specialist College | `20260719000012_specialist_college.sql` | ✅ Done |
| 10 | Residential Rehabilitation Service | `20260719000013_residential_rehab.sql` | ✅ Done |
| 11 | Community Drug and Alcohol Service | — | ⬜ To do |

## Notes

- Dementia sub-service items are seeded for all residential and housing types (items at display_order 51+)
- Shared Lives Scheme: DoLS **can** apply (unlike ECH where it cannot) — person lives in carer's home, not their own tenancy
- Dual-Registered: inherits Nursing Home items then overrides where combined registration changes the requirement
- ARBD: inherits Residential Care Home items then applies alcohol-related brain damage-specific overrides
- Supported Living: will need MCA/DoLS items similar to Shared Lives; no pendant system; tenancy rights apply (like ECH); but staff may not be on-site overnight
- Specialist College: Ofsted-registered alongside CQC; younger adults (18+); education and independence goals prominent
- Residential Rehab: time-limited placements; abstinence or harm-reduction model; DRD (drug-related death) prevention prominent
- Community Drug and Alcohol: non-residential; outreach and keyworking model; no overnight care; harm reduction focus

## Upcoming migration filenames

| Service Type | Planned filename |
|---|---|
| Supported Living | `20260719000011_supported_living.sql` |
| Specialist College | `20260719000012_specialist_college.sql` |
| Residential Rehabilitation Service | `20260719000013_residential_rehab.sql` |
| Community Drug and Alcohol Service | `20260719000014_community_drug_alcohol.sql` |
