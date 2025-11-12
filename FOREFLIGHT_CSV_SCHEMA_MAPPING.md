# ForeFlight CSV to Desert Skies Logbook - Schema Mapping

## ForeFlight CSV Schema (65 Columns)

Based on Thomas's export from ForeFlight, here are all columns:

```
Date, AircraftID, From, To, Route, TimeOut, TimeOff, TimeOn, TimeIn, 
OnDuty, OffDuty, TotalTime, PIC, SIC, Night, Solo, CrossCountry, 
PICUS, MultiPilot, IFR, Examiner, NVG, NVG Ops, Distance, 
ActualInstrument, SimulatedInstrument, HobbsStart, HobbsEnd, 
TachStart, TachEnd, Holds, Approach1-6, DualGiven, DualReceived, 
SimulatedFlight, GroundTraining, GroundTrainingGiven, InstructorName, 
InstructorComments, Person1-6, PilotComments, Flight Review (FAA), 
IPC (FAA), Checkride (FAA), FAA 61.58 (FAA), NVG Proficiency (FAA), 
Takeoff Day, Landing Full-Stop Day, DayTakeoffs, DayLandingsFullStop, 
NightTakeoffs, NightLandingsFullStop, AllLandings, [Hours]ATP XC, [Hours]PICUS
```

## Mapping to Desert Skies Schema

### ✅ Direct Matches (Already in Schema)

| ForeFlight Column | Desert Skies Column | Type | Notes |
|---|---|---|---|
| `Date` | `date` | DATE | Direct match |
| `AircraftID` | `aircraft_id` | UUID | Requires lookup/creation |
| `TotalTime` | `total_time` | DECIMAL(5,2) | Direct match |
| `PIC` | `pic_time` | DECIMAL(5,2) | Direct match |
| `SIC` | `sic_time` | DECIMAL(5,2) | Direct match |
| `Night` | `night_time` | DECIMAL(5,2) | Direct match |
| `Solo` | `solo_time` | DECIMAL(5,2) | Direct match |
| `CrossCountry` | `cross_country_time` | DECIMAL(5,2) | Direct match |
| `ActualInstrument` | `instrument_time` | DECIMAL(5,2) | Direct match |
| `SimulatedInstrument` | Combine with `instrument_time` | DECIMAL(5,2) | Sum both |
| `SimulatedFlight` | `simulator_time` | DECIMAL(5,2) | Direct match |
| `DualReceived` | `dual_received` | DECIMAL(5,2) | Direct match |
| `DualGiven` | `dual_given` | DECIMAL(5,2) | Direct match |
| `DayLandingsFullStop` | `landings_day` | INTEGER | Direct match |
| `NightLandingsFullStop` | `landings_night` | INTEGER | Direct match |

### ⚠️ Needs New Columns

| ForeFlight Column | New Desert Skies Column | Type | Reason |
|---|---|---|---|
| `From` | `departure_airport` | TEXT | Already in schema! |
| `To` | `arrival_airport` | TEXT | Already in schema! |
| `Route` | `route` | TEXT | Already in schema! |
| `InstructorName` | Parse to `instructor_id` | UUID | Need to lookup |
| `PilotComments` | `remarks` | TEXT | Direct match |
| `InstructorComments` | Append to `remarks` | TEXT | Combine with pilot comments |
| `HobbsStart` | Need new column | DECIMAL(5,2) | Useful for verification |
| `HobbsEnd` | Need new column | DECIMAL(5,2) | Useful for verification |
| `ComplexAircraft` | `complex_time` | DECIMAL(5,2) | From aircraft table |
| `HighPerformance` | `high_performance_time` | DECIMAL(5,2) | From aircraft table |
| `Tailwheel` | `tailwheel_time` | DECIMAL(5,2) | From aircraft table |
| `MultiEngine` | `multi_engine_time` | DECIMAL(5,2) | From aircraft table |

### 🆕 Additional ForeFlight Columns (Optional Tracking)

These are in ForeFlight but may not be needed in Desert Skies:

| ForeFlight Column | Suggested Action |
|---|---|
| `TimeOut`, `TimeOff`, `TimeOn`, `TimeIn` | Could track as JSONB metadata |
| `OnDuty`, `OffDuty` | Part 135/121 operations - skip |
| `PICUS`, `MultiPilot` | Advanced ratings - skip for now |
| `IFR`, `Examiner`, `NVG`, `NVG Ops` | Special operations - skip |
| `Distance` | Calculate from route if needed |
| `Holds` | Could store in metadata JSONB |
| `Approach1-6` | Could store in metadata JSONB |
| `GroundTraining`, `GroundTrainingGiven` | Separate from flight time |
| `Person1-6` | Passengers - could store in metadata |
| `Flight Review (FAA)`, `IPC (FAA)`, etc. | Endorsements - separate table |
| `TakeoffDay`, `DayTakeoffs`, etc. | Already have landings; takeoffs optional |
| `[Hours]ATP XC`, `[Hours]PICUS` | Advanced tracking - skip |

## Updated Schema Requirements

### Minimal Changes Needed

Good news! Our existing schema **already supports** most ForeFlight fields:
- ✅ `departure_airport` (already in schema)
- ✅ `arrival_airport` (already in schema)
- ✅ `route` (already in schema)
- ✅ All time fields (total, PIC, dual, etc.)
- ✅ All landing fields
- ✅ `remarks` (for comments)

### Optional Enhancements

Add to `flight_log_entries` table:

```sql
-- Optional: Store raw ForeFlight data for reference
ff_import_metadata JSONB,

-- Optional: Hobbs tracking (useful for verification)
hobbs_start DECIMAL(5,2),
hobbs_end DECIMAL(5,2),

-- Optional: Additional landings detail
day_takeoffs INTEGER DEFAULT 0,
night_takeoffs INTEGER DEFAULT 0,
all_landings INTEGER DEFAULT 0
```

### Aircraft Table Matching

Need to create/lookup aircraft by tail number:
- ForeFlight: `N47367`
- Desert Skies: Lookup in `aircraft` table by `tail_number`
- If not found: Create new aircraft entry

### Instructor Matching

Need to parse instructor name and lookup:
- ForeFlight: `InstructorName` (e.g., "Matt DiGangi")
- Desert Skies: Lookup in `profiles` table by name
- If not found: Create placeholder or leave null

## Import Algorithm

### Phase 1: Parse CSV

1. Skip first 74 lines (header/aircraft table)
2. Line 75 = column headers
3. Line 76+ = flight data
4. Parse each line, handling quoted strings (commas in comments)

### Phase 2: Data Transformation

For each row:
1. Parse `Date` → ISO format
2. Lookup/create `AircraftID` → `aircraft_id` (UUID)
3. Parse `InstructorName` → `instructor_id` (UUID or null)
4. Map all time fields (convert to decimal)
5. Combine `PilotComments` + `InstructorComments` → `remarks`
6. Determine aircraft characteristics (complex, high-perf, etc.)

### Phase 3: Validation

- Check for required fields (date, aircraft, total_time)
- Validate time math: `total_time >= pic + sic + dual_received`
- Check for duplicates (same date, aircraft, total_time)
- Verify aircraft exists or can be created

### Phase 4: Import

- Create `flight_log_entries` records
- Set `status = 'draft'` (student can review)
- Link to student user ID
- Store original ForeFlight data in metadata JSONB

## Example Transformation

### ForeFlight Row:
```
2025-11-10,N47367,KFFZ,KFFZ,,19:07,19:29,20:36,20:51,,,1.5,1.5,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0,0.00,0.0,0.0,0.00,0.00,0.00,0.00,0,,,,,,,1.5,0.0,0.0,0.0,0.0,,,,,,,,,,"DSA Flight Debrief – Matt Degangi Flight #: 20..."
```

### Desert Skies Record:
```json
{
  "student_id": "uuid-of-thomas",
  "date": "2025-11-10",
  "aircraft_id": "uuid-of-N47367",
  "instructor_id": null,
  "departure_airport": "KFFZ",
  "arrival_airport": "KFFZ",
  "route": "",
  "total_time": 1.5,
  "pic_time": 1.5,
  "dual_received": 1.5,
  "dual_given": 0.0,
  "solo_time": 0.0,
  "cross_country_time": 0.0,
  "night_time": 0.0,
  "instrument_time": 0.0,
  "simulator_time": 0.0,
  "landings_day": 0,
  "landings_night": 0,
  "remarks": "DSA Flight Debrief – Matt Degangi Flight #: 20...",
  "ff_import_metadata": {
    "source": "foreflight_import",
    "import_date": "2025-11-12",
    "time_out": "19:07",
    "time_in": "20:51",
    "original_row": 76
  }
}
```

## Duplicate Detection

To prevent duplicate imports:

1. **Check before import**: Query existing entries with same:
   - `date`
   - `aircraft_id` (or tail number)
   - `total_time`
   
2. **Fuzzy matching**: Allow ±0.1 hours difference

3. **User confirmation**: Show potential duplicates and let user decide

## Benefits of This Approach

✅ **Preserves ForeFlight data** - Metadata JSONB stores original

✅ **Flexible** - Can import partial data (missing instructor OK)

✅ **Verifiable** - Students can review before finalizing

✅ **Extensible** - Easy to add more ForeFlight fields later

✅ **Compatible** - Works with existing Desert Skies schema

✅ **Auditable** - Tracks import source and date

