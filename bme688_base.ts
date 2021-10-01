////////////////////////////////
//          BME688            //
////////////////////////////////

namespace kitronik_BME688 {
    // Useful BME688 Register Addresses
    // Control
    export const CHIP_ADDRESS = 0x77    // I2C address as determined by hardware configuration
    export const CTRL_MEAS = 0x74       // Bit position <7:5>: Temperature oversampling   Bit position <4:2>: Pressure oversampling   Bit position <1:0>: Sensor power mode
    export const RESET = 0xE0           // Write 0xB6 to initiate soft-reset (same effect as power-on reset)
    export const CHIP_ID = 0xD0         // Read this to return the chip ID: 0x61 - good way to check communication is occurring
    export const CTRL_HUM = 0x72        // Bit position <2:0>: Humidity oversampling settings
    export const CONFIG = 0x75          // Bit position <4:2>: IIR filter settings
    export const CTRL_GAS_0 = 0x70      // Bit position <3>: Heater off (set to '1' to turn off current injection)
    export const CTRL_GAS_1 = 0x71      // Bit position <5> DATASHEET ERROR: Enable gas conversions to start when set to '1'   Bit position <3:0>: Heater step selection (0 to 9)

    // Pressure Data
    export const PRESS_MSB_0 = 0x1F     // Forced & Parallel: MSB [19:12]
    export const PRESS_LSB_0 = 0x20     // Forced & Parallel: LSB [11:4]
    export const PRESS_XLSB_0 = 0x21    // Forced & Parallel: XLSB [3:0]

    // Temperature Data
    export const TEMP_MSB_0 = 0x22      // Forced & Parallel: MSB [19:12]
    export const TEMP_LSB_0 = 0x23      // Forced & Parallel: LSB [11:4]
    export const TEMP_XLSB_0 = 0x24     // Forced & Parallel: XLSB [3:0]

    // Humidity Data
    export const HUMID_MSB_0 = 0x25     // Forced & Parallel: MSB [15:8]
    export const HUMID_LSB_0 = 0x26     // Forced & Parallel: LSB [7:0]

    // Gas Resistance Data
    export const GAS_RES_MSB_0 = 0x2C   // Forced & Parallel: MSB [9:2]
    export const GAS_RES_LSB_0 = 0x2D   // Forced & Parallel: Bit <7:6>: LSB [1:0]    Bit <5>: Gas valid    Bit <4>: Heater stability    Bit <3:0>: Gas resistance range

    // Status
    export const MEAS_STATUS_0 = 0x1D   // Forced & Parallel: Bit <7>: New data    Bit <6>: Gas measuring    Bit <5>: Measuring    Bit <3:0>: Gas measurement index

    //The following functions are for reading from and writing to the registers on the BME688
    //function for reading register as unsigned 8 bit integer
    export function getUInt8BE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.UInt8BE);
    }

    //function for reading register as signed 8 bit integer (big endian)
    export function getInt8BE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.Int8BE);
    }

    // Function to convert unsigned ints to twos complement signed ints
    export function twosComp(value: number, bits: number): number {
        if ((value & (1 << (bits - 1))) != 0) {
            value = value - (1 << bits)
        }
        return value
    }

    // Write a buffer to a register
    export function i2cWrite(reg: number, data: number): void {
        writeBuf[0] = reg
        writeBuf[1] = data
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)
    }

    // Calibration parameters for compensation calculations
    // Temperature
    let PAR_T1 = twosComp((getUInt8BE(0xEA) << 8) | getUInt8BE(0xE9), 16)   // Signed 16-bit
    let PAR_T2 = twosComp((getUInt8BE(0x8B) << 8) | getUInt8BE(0x8A), 16)     // Signed 16-bit
    let PAR_T3 = getInt8BE(0x8C)                                            // Signed 8-bit

    // Pressure
    let PAR_P1 = (getUInt8BE(0x8F) << 8) | getUInt8BE(0x8E)                 // Always a positive number, do not do twosComp() conversion!
    let PAR_P2 = twosComp((getUInt8BE(0x91) << 8) | getUInt8BE(0x90), 16)   // Signed 16-bit
    let PAR_P3 = getInt8BE(0x92)                                            // Signed 8-bit
    let PAR_P4 = twosComp((getUInt8BE(0x95) << 8) | getUInt8BE(0x94), 16)   // Signed 16-bit
    let PAR_P5 = twosComp((getUInt8BE(0x97) << 8) | getUInt8BE(0x96), 16)   // Signed 16-bit
    let PAR_P6 = getInt8BE(0x99)                                            // Signed 8-bit
    let PAR_P7 = getInt8BE(0x98)                                            // Signed 8-bit
    let PAR_P8 = twosComp((getUInt8BE(0x9D) << 8) | getUInt8BE(0x9C), 16)   // Signed 16-bit
    let PAR_P9 = twosComp((getUInt8BE(0x9F) << 8) | getUInt8BE(0x9E), 16)   // Signed 16-bit
    let PAR_P10 = getInt8BE(0xA0)                                           // Signed 8-bit

    // Humidity
    let parH1_LSB_parH2_LSB = getUInt8BE(0xE2)
    let PAR_H1 = (getUInt8BE(0xE3) << 4) | (parH1_LSB_parH2_LSB & 0x0F)
    let PAR_H2 = (getUInt8BE(0xE1) << 4) | (parH1_LSB_parH2_LSB >> 4)
    let PAR_H3 = getInt8BE(0xE4)                                            // Signed 8-bit
    let PAR_H4 = getInt8BE(0xE5)                                            // Signed 8-bit
    let PAR_H5 = getInt8BE(0xE6)                                            // Signed 8-bit
    let PAR_H6 = getInt8BE(0xE7)                                            // Signed 8-bit
    let PAR_H7 = getInt8BE(0xE8)                                            // Signed 8-bit

    // Gas resistance
    let PAR_G1 = getInt8BE(0xED)                                            // Signed 8-bit
    let PAR_G2 = twosComp((getUInt8BE(0xEC) << 8) | getUInt8BE(0xEB), 16)   // Signed 16-bit
    let PAR_G3 = getUInt8BE(0xEE)                                           // Unsigned 8-bit
    let RES_HEAT_RANGE = (getUInt8BE(0x02) >> 4) & 0x03
    let RES_HEAT_VAL = twosComp(getUInt8BE(0x00), 8)                        // Signed 8-bit

    // Oversampling rate constants
    const OSRS_1X = 0x01
    const OSRS_2X = 0x02
    const OSRS_4X = 0x03
    const OSRS_8X = 0x04
    const OSRS_16X = 0x05

    // IIR filter coefficient values
    const IIR_0 = 0x00
    const IIR_1 = 0x01
    const IIR_3 = 0x02
    const IIR_7 = 0x03
    const IIR_15 = 0x04
    const IIR_31 = 0x05
    const IIR_63 = 0x06
    const IIR_127 = 0x07

    //Global variables used for storing one copy of value, these are used in multiple locations for calculations
    let bme688InitFlag = false
    let gasInit = false
    let writeBuf = pins.createBuffer(2)

    // Calculated readings of sensor parameters from raw adc readings
    export let tRead = 0
    export let pRead = 0
    export let hRead = 0
    export let gRes = 0
    export let iaqPercent = 0
    export let iaqScore = 0
    export let eCO2Value = 0

    let gBase = 0
    let hBase = 40        // Between 30% & 50% is a widely recognised optimal indoor humidity, 40% is a good middle ground
    let hWeight = 0.25     // Humidity contributes 25% to the IAQ score, gas resistance is 75%
    let tPrev = 0
    let hPrev = 0
    let measTime = 0
    let measTimePrev = 0

    export let tRaw = 0    // adc reading of raw temperature
    export let pRaw = 0       // adc reading of raw pressure
    export let hRaw = 0       // adc reading of raw humidity
    export let gResRaw = 0  // adc reading of raw gas resistance
    export let gasRange = 0

    // Compensation calculation intermediate variables (used across temperature, pressure, humidity and gas)
    let var1 = 0
    let var2 = 0
    let var3 = 0
    let var4 = 0
    let var5 = 0
    let var6 = 0

    let t_fine = 0                          // Intermediate temperature value used for pressure calculation
    let newAmbTemp = 0
    export let tAmbient = 0       // Intermediate temperature value used for heater calculation
    let ambTempFlag = false

    // Temperature compensation calculation: rawADC to degrees C (integer)
    export function calcTemperature(tempADC: number): void {
        tPrev = tRead

        var1 = (tempADC >> 3) - (PAR_T1 << 1)
        var2 = (var1 * PAR_T2) >> 11
        var3 = ((((var1 >> 1) * (var1 >> 1)) >> 12) * (PAR_T3 << 4)) >> 14
        t_fine = var2 + var3
        newAmbTemp = ((t_fine * 5) + 128) >> 8
        tRead = newAmbTemp / 100     // Convert to floating point with 2 dp
        if (ambTempFlag == false) {
            tAmbient = newAmbTemp
        }
    }

    // Pressure compensation calculation: rawADC to Pascals (integer)
    export function intCalcPressure(pressureADC: number): void {
        var1 = (t_fine >> 1) - 64000
        var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * PAR_P6) >> 2
        var2 = var2 + ((var1 * PAR_P5) << 1)
        var2 = (var2 >> 2) + (PAR_P4 << 16)
        var1 = (((((var1 >> 2) * (var1 >> 2)) >> 13) * (PAR_P3 << 5)) >> 3) + ((PAR_P2 * var1) >> 1)
        var1 = var1 >> 18
        var1 = ((32768 + var1) * PAR_P1) >> 15
        pRead = 1048576 - pressureADC
        pRead = ((pRead - (var2 >> 12)) * 3125)

        if (pRead >= (1 << 30)) {
            pRead = Math.idiv(pRead, var1) << 1
        }
        else {
            pRead = Math.idiv((pRead << 1), var1)
        }

        var1 = (PAR_P9 * (((pRead >> 3) * (pRead >> 3)) >> 13)) >> 12
        var2 = ((pRead >> 2) * PAR_P8) >> 13
        var3 = ((pRead >> 8) * (pRead >> 8) * (pRead >> 8) * PAR_P10) >> 17
        pRead = pRead + ((var1 + var2 + var3 + (PAR_P7 << 7)) >> 4)
    }

    // Humidity compensation calculation: rawADC to % (integer)
    // 'tempScaled' is the current reading from the Temperature sensor
    export function intCalcHumidity(humidADC: number, tempScaled: number): void {
        hPrev = hRead

        var1 = humidADC - (PAR_H1 << 4) - (Math.idiv((tempScaled * PAR_H3), 100) >> 1)
        var2 = (PAR_H2 * (Math.idiv((tempScaled * PAR_H4), 100) + Math.idiv(((tempScaled * (Math.idiv((tempScaled * PAR_H5), 100))) >> 6), 100) + ((1 << 14)))) >> 10
        var3 = var1 * var2
        var4 = ((PAR_H6 << 7) + (Math.idiv((tempScaled * PAR_H7), 100))) >> 4
        var5 = ((var3 >> 14) * (var3 >> 14)) >> 10
        var6 = (var4 * var5) >> 1
        hRead = (var3 + var6) >> 12
        hRead = (((var3 + var6) >> 10) * (1000)) >> 12
        hRead = Math.idiv(hRead, 1000)
    }

    // Gas sensor heater target temperature to target resistance calculation
    // 'ambientTemp' is reading from Temperature sensor in degC (could be averaged over a day when there is enough data?)
    // 'targetTemp' is the desired temperature of the hot plate in degC (in range 200 to 400)
    // Note: Heating duration also needs to be specified for each heating step in 'gas_wait' registers
    export function intConvertGasTargetTemp(ambientTemp: number, targetTemp: number): number {
        var1 = Math.idiv((ambientTemp * PAR_G3), 1000) << 8    // Divide by 1000 as we have ambientTemp in pre-degC format (i.e. 2500 rather than 25.00 degC)
        var2 = (PAR_G1 + 784) * Math.idiv((Math.idiv(((PAR_G2 + 154009) * targetTemp * 5), 100) + 3276800), 10)
        var3 = var1 + (var2 >> 1)
        var4 = Math.idiv(var3, (RES_HEAT_RANGE + 4))
        var5 = (131 * RES_HEAT_VAL) + 65536                 // Target heater resistance in Ohms
        let resHeatX100 = ((Math.idiv(var4, var5) - 250) * 34)
        let resHeat = Math.idiv((resHeatX100 + 50), 100)

        return resHeat
    }

    // Gas resistance compensation calculation: rawADC & range to Ohms (integer)
    export function intCalcGasResistance(gasADC: number, gasRange: number): void {
        var1 = 262144 >> gasRange
        //var2 = gasADC - 512
        //var2 = var2 * 3
        //var2 = 4096 + var2
        var2 = 4096 + ((gasADC - 512) * 3)
        let calcGasRes = Math.idiv((10000 * var1), var2)

        gRes = calcGasRes * 100
    }

    // Initialise the BME688, establishing communication, entering initial T, P & H oversampling rates, setup filter and do a first data reading (won't return gas)
    export function initialise(): void {
        // Establish communication with BME688
        writeBuf[0] = CHIP_ID
        let chipID = getUInt8BE(writeBuf[0])
        while (chipID != 0x61) {
            chipID = getUInt8BE(writeBuf[0])
        }

        // Do a soft reset
        i2cWrite(RESET, 0xB6)
        basic.pause(1000)

        // Set mode to SLEEP MODE: CTRL_MEAS reg <1:0>
        i2cWrite(CTRL_MEAS, 0x00)

        // Set the oversampling rates for Temperature, Pressure and Humidity
        // Humidity: CTRL_HUM bits <2:0>
        i2cWrite(CTRL_HUM, OSRS_2X)
        // Temperature: CTRL_MEAS bits <7:5>     Pressure: CTRL_MEAS bits <4:2>    (Combine and write both in one command)
        i2cWrite(CTRL_MEAS, (OSRS_2X << 5) | (OSRS_16X << 2))

        // IIR Filter: CONFIG bits <4:2>
        i2cWrite(CONFIG, IIR_3 << 2)

        // Enable gas conversion: CTRL_GAS_1 bit <5>    (although datasheet says <4> - not sure what's going on here...)
        i2cWrite(CTRL_GAS_1, 0x20)      // LOOKS LIKE IT'S BIT 5 NOT BIT 4 - NOT WHAT THE DATASHEET SAYS
    }

    /**
    * Setup the gas sensor ready to measure gas resistance.
    */
    export function initGasSensor(): void {
        // Define the target heater resistance from temperature (Heater Step 0)
        i2cWrite(0x5A, intConvertGasTargetTemp(tAmbient, 300))     // Write the target temperature (300°C) to res_wait_0 register - heater step 0

        // Define the heater on time, converting ms to register code (Heater Step 0) - cannot be greater than 4032ms
        // Bits <7:6> are a multiplier (1, 4, 16 or 64 times)    Bits <5:0> are 1ms steps (0 to 63ms)
        //i2cWrite(0x64, 101)        // Write the coded duration (101) of 150ms to gas_wait_0 register - heater step 0
        i2cWrite(0x64, 109)        // Write the coded duration (109) of 180ms to gas_wait_0 register - heater step 0

        // Select index of heater step (0 to 9): CTRL_GAS_1 reg <3:0>    (Make sure to combine with gas enable setting already there)
        let gasEnable = (getUInt8BE(writeBuf[0]) & 0x20)
        i2cWrite(CTRL_GAS_1, (0x00 | gasEnable))          // Select heater step 0
    }

    /**
    * Run all measurements on the BME688: Temperature, Pressure, Humidity & Gas Resistance.
    */
    export function readDataRegisters(): void {
        measTimePrev = measTime       // Store previous measurement time (ms since micro:bit powered on)

        // Set mode to FORCED MODE to begin single read cycle: CTRL_MEAS reg <1:0>    (Make sure to combine with temp/pressure oversampling settings already there)
        let oSampleTP = getUInt8BE(writeBuf[0])
        i2cWrite(CTRL_MEAS, 0x01 | oSampleTP)

        // Check New Data bit to see if values have been measured: MEAS_STATUS_0 bit <7>
        writeBuf[0] = MEAS_STATUS_0
        let newData = (getUInt8BE(writeBuf[0]) & 0x80) >> 7
        while (newData != 1) {
            newData = (getUInt8BE(writeBuf[0]) & 0x80) >> 7
        }

        // Check Heater Stability Status bit to see if gas values have been measured: <4> (heater stability)
        writeBuf[0] = GAS_RES_LSB_0
        let heaterStable = (getUInt8BE(writeBuf[0]) & 0x10) >> 4

        // If there is new data, read temperature ADC registers(this is required for all other calculations)
        tRaw = (getUInt8BE(TEMP_MSB_0) << 12) | (getUInt8BE(TEMP_LSB_0) << 4) | (getUInt8BE(TEMP_XLSB_0) >> 4)

        // Read pressure ADC registers
        pRaw = (getUInt8BE(PRESS_MSB_0) << 12) | (getUInt8BE(PRESS_LSB_0) << 4) | (getUInt8BE(PRESS_XLSB_0) >> 4)

        // Read humidity ADC registers
        hRaw = (getUInt8BE(HUMID_MSB_0) << 8) | getUInt8BE(HUMID_LSB_0)

        // Read gas resistance ADC registers
        gResRaw = (getUInt8BE(GAS_RES_MSB_0) << 2) | (getUInt8BE(GAS_RES_LSB_0) >> 6)   // Shift bits <7:6> right to get LSB for gas resistance

        gasRange = getUInt8BE(GAS_RES_LSB_0) & 0x0F

        measTime = control.millis()      // Capture latest measurement time (ms since micro:bit powered on)
    }

    // A baseline gas resistance is required for the IAQ calculation - it should be taken in a well ventilated area without obvious air pollutants
    // Take 60 readings over a ~5min period and find the mean
    /**
    * Establish the baseline gas resistance reading and the ambient temperature.
    * These values are required for air quality calculations.
    */
    export function establishBaselines(): void {
        ambTempFlag = false

        let burnInReadings = 0
        let burnInData = 0
        let ambTotal = 0
        while (burnInReadings < 60) {               // Measure data and continue summing gas resistance until 60 readings have been taken
            readDataRegisters()
            calcTemperature(tRaw)
            intCalcGasResistance(gResRaw, gasRange)
            burnInData += gRes
            ambTotal += newAmbTemp
            basic.pause(5000)
            burnInReadings++
        }
        gBase = Math.trunc(burnInData / 60)             // Find the mean gas resistance during the period to form the baseline
        tAmbient = Math.trunc(ambTotal / 60)    // Calculate the ambient temperature as the mean of the 60 initial readings

        ambTempFlag = true
    }

    // Calculate the Index of Air Quality score from the current gas resistance and humidity readings
    // iaqPercent: 0 to 100% - higher value = better air quality
    // iaqScore: 25 should correspond to 'typically good' air, 250 to 'typically polluted' air
    // airQualityRating: Text output based on the iaqScore
    // Calculate the estimated CO2 value (eCO2)
    export function calcAirQuality(): void {
        let humidityScore = 0
        let gasScore = 0
        let humidityOffset = hRead - hBase         // Calculate the humidity offset from the baseline setting
        let ambTemp = (tAmbient / 100)
        let temperatureOffset = tRead - ambTemp     // Calculate the temperature offset from the ambient temperature
        let humidityRatio = ((humidityOffset / hBase) + 1)
        let temperatureRatio = (temperatureOffset / ambTemp)

        // IAQ Calculations

        if (humidityOffset > 0) {                                       // Different paths for calculating the humidity score depending on whether the offset is greater than 0
            humidityScore = (100 - hRead) / (100 - hBase)
        }
        else {
            humidityScore = hRead / hBase
        }
        humidityScore = humidityScore * hWeight * 100

        let gasRatio = (gRes / gBase)

        if ((gBase - gRes) > 0) {                                            // Different paths for calculating the gas score depending on whether the offset is greater than 0
            gasScore = gasRatio * (100 * (1 - hWeight))
        }
        else {
            // Make sure that when the gas offset and humidityOffset are 0, iaqPercent is 95% - leaves room for cleaner air to be identified
            gasScore = Math.round(70 + (5 * (gasRatio - 1)))
            if (gasScore > 75) {
                gasScore = 75
            }
        }

        iaqPercent = Math.trunc(humidityScore + gasScore)               // Air quality percentage is the sum of the humidity (25% weighting) and gas (75% weighting) scores
        iaqScore = (100 - iaqPercent) * 5                               // Final air quality score is in range 0 - 500 (see BME688 datasheet page 11 for details)

        // eCO2 Calculations

        eCO2Value = 250 * Math.pow(Math.E, (0.012 * iaqScore))      // Exponential curve equation to calculate the eCO2 from an iaqScore input

        // Adjust eCO2Value for humidity and/or temperature greater than the baseline values
        if (humidityOffset > 0) {
            if (temperatureOffset > 0) {
                eCO2Value = eCO2Value * (humidityRatio + temperatureRatio)
            }
            else {
                eCO2Value = eCO2Value * humidityRatio
            }
        }
        else if (temperatureOffset > 0) {
            eCO2Value = eCO2Value * (temperatureRatio + 1)
        }

        // If measurements are taking place rapidly, breath detection is possible due to the sudden increase in humidity (~7-10%)
        // If this increase happens within a 5s time window, 1200ppm is added to the eCO2 value
        // (These values were based on 'breath-testing' with another eCO2 sensor with algorithms built-in)
        if ((measTime - measTimePrev) <= 5000) {
            if ((hRead - hPrev) >= 3) {
                eCO2Value = eCO2Value + 1500
            }
        }

        eCO2Value = Math.trunc(eCO2Value)
    }
}

