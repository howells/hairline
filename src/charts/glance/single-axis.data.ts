/**
 * Predicted tide height by hour on 17 October 2026 at six stations up the
 * Hudson River, from Sandy Hook at the mouth to Albany, in metres above MLLW
 * and local standard time (EST, UTC-5).
 * The table is in single-axis.tides.json.
 *
 * Source: NOAA CO-OPS tide predictions (Center for Operational Oceanographic
 * Products and Services), hourly. Station IDs
 * were looked up in NOAA's station list (all six are type "R", harmonic):
 * https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions
 * One query per station, all with datum=MLLW (mean lower low water),
 * time_zone=lst (local standard time, EST, no daylight saving; all six stations share it), units=metric, interval=h:
 *   8531680 Sandy Hook: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261031&datum=MLLW&station=8531680&time_zone=lst&units=metric&interval=h&format=json
 *   8518750 Battery: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261031&datum=MLLW&station=8518750&time_zone=lst&units=metric&interval=h&format=json
 *   8518924 Haverstraw: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261031&datum=MLLW&station=8518924&time_zone=lst&units=metric&interval=h&format=json
 *   8518951 Hyde Park: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261031&datum=MLLW&station=8518951&time_zone=lst&units=metric&interval=h&format=json
 *   8518979 Coxsackie: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261031&datum=MLLW&station=8518979&time_zone=lst&units=metric&interval=h&format=json
 *   8518995 Albany: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261031&datum=MLLW&station=8518995&time_zone=lst&units=metric&interval=h&format=json
 * Fetched 2026-10-15. Each query asked for 1 to 31 October 2026.
 *
 * Transform: from each file, the 24 hourly heights stamped 2026-10-17 00:00 to
 * 23:00 EST, as given, in metres. That day was picked from the month because
 * every height at all six stations stays above zero, so no hour loses its
 * circle, and each station's highest hour is inside the day. Rows run in river
 * order, mouth to Albany. The hour of each station's highest height that day,
 * read from the same heights (hours 12, 13, 15, 17, 20, 21), is later at every step upstream.
 */
import tides from "./single-axis.tides.json";

export interface SingleAxisRow {
  label: string;
  /** One value per column (hour). */
  values: number[];
}

export const singleAxisDemo: SingleAxisRow[] = tides;
