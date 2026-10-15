export interface MatrixGlanceData {
  columns: string[];
  rows: string[];
  /** values[row][column]. */
  values: number[][];
}

/**
 * Kit by income: the percentage of UK households that own a car or van, a
 * tumble dryer, a dishwasher, a home computer, an internet connection and a
 * mobile phone, by tenth of gross household income, financial year ending 2019
 * (April 2018 to March 2019). It is the last year the survey asked about
 * dishwashers and tumble dryers.
 *
 * Source: Office for National Statistics, Family spending workbook 4:
 * expenditure by household characteristic, financial years ending 2001 to
 * 2019 (Living Costs and Food Survey; Open Government Licence v3.0), sheets
 * A46 "Percentage of households with durable goods by income group and
 * household composition" and A47 "Percentage of households with cars by income
 * group":
 * https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/expenditure/datasets/familyspendingworkbook4expenditurebyhouseholdcharacteristic
 * file https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/personalandhouseholdfinances/expenditure/datasets/familyspendingworkbook4expenditurebyhouseholdcharacteristic/fye2001tofye2019/familyspendingworkbook4expenditurebyhouseholdcharacteristics.xlsx
 * Fetched 2026-10-15.
 *
 * Transform: the ten rows "Lowest ten per cent" to "Highest ten per cent"
 * under "Gross income decile group". Tumble dryer, Dishwasher, Computer
 * (home computer), Internet (internet connection) and Mobile (mobile phone)
 * are the A46 columns of those names; Car is the A47 column "All with
 * cars/vans". Whole per cents, as published. Rows are labelled by tenth
 * ("2nd" is the second decile group). The workbook for the year ending 2021
 * (note 3 to its table A46) says the dishwasher and tumble dryer questions
 * were removed from the questionnaire that year.
 * Sanity: 20% of households in the lowest tenth have a dishwasher against 83%
 * in the highest; the mobile phone is the flattest, 88% to 99%.
 */
export const matrixHeatGlanceDemo: MatrixGlanceData = {
  columns: [
    "Car",
    "Tumble dryer",
    "Dishwasher",
    "Computer",
    "Internet",
    "Mobile",
  ],
  rows: [
    "Lowest tenth",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "Highest tenth",
  ],
  values: [
    [40, 36, 20, 63, 69, 88],
    [54, 44, 23, 70, 72, 87],
    [65, 51, 30, 83, 86, 95],
    [79, 55, 39, 87, 90, 96],
    [84, 56, 47, 94, 96, 98],
    [93, 60, 51, 96, 98, 99],
    [92, 65, 55, 97, 99, 99],
    [93, 67, 64, 99, 99, 99],
    [94, 72, 74, 99, 99, 99],
    [92, 73, 83, 100, 99, 99],
  ],
};
