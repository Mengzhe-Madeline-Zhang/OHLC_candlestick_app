import "./App.css";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import cvsFilePath from "./data/S&P500Index.csv";
import Chart from "react-apexcharts";

//get csv data from google finance
async function fetchCsv() {
  const response = await fetch(cvsFilePath);
  const reader = response.body.getReader();
  const result = await reader.read();
  const decoder = new TextDecoder("utf-8");
  const csv = decoder.decode(result.value); 
  const results = Papa.parse(csv, { header: true });
  return results;
}

//set chart options 
const chart = {
  options: {
    chart: {
      type: "candlestick",
      height: 350,
    },
    title: {
      text: "CandleStick Chart",
      align: "left",
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      type: "numeric",
    },

    animations: {
      enabled: false,
    },
    dataLabels: {
      enabled: false,
    },

    stroke: {
      width: 1,
      curve: "straight",
    },
    markers: {
      size: 0,
    },

    tooltip: {
      shared: false,
      intersect: true,
      y: {
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return y.toFixed(0) + " points";
          }
          return y;
        },
      },
    },
  },
};

//calculate moving average data for a period of days
function movingAverage(period, closeValues) {
  let movingAverageArray = [];

  for (var i = 0; i < closeValues.length; i++) {
    if (i < period - 1) {
      movingAverageArray.push(null);
    } else {
      const averageNumbers = closeValues.slice(i - period + 1, i + 1);

      const averageNumber =
        averageNumbers.reduce((total, num) => total + num) / period;

      movingAverageArray.push(averageNumber);
    }
  }

  return movingAverageArray;
}

function App() {

  //use state to keep series info for the chart
  const [series, setSeries] = useState([]);

  useEffect(() => {
    async function getChartData() {
      try {
        const data = await fetchCsv();
        const OHLCdata = data.data.map((data, index) => ({
          x: data.Date,
          y: [
            parseInt(data.Open),
            parseInt(data.High),
            parseInt(data.Low),
            parseInt(data.Close),
          ],
        }));

        const closeValues = data.data.map((data) => parseInt(data.Close));

        //get y values of 50-day and 200-day moving average lines
        const mv50 = movingAverage(50, closeValues);
        const mv200 = movingAverage(200, closeValues);

        const mv50data = data.data.map((data, index) => ({
          x: data.Date,
          y: mv50[index],
        }));

        const mv200data = data.data.map((data, index) => ({
          x: data.Date,
          y: mv200[index],
        }));

        setSeries([
          {
            name: "OHLC candlestick",
            type: "candlestick",
            data: OHLCdata,
            color: "#43BCCD",
          },
          {
            name: "50-day moving average",
            type: "line",
            data: mv50data,
            color: "#449DD1",
          },
          {
            name: "200-day moving average",
            type: "line",
            data: mv200data,
            color: "#662E9B",
          },
        ]);
      } catch (error) {
        console.log(error);
      }
    }

    getChartData();
  }, []);

  return (
    <div className="App">
      <h1 className="ticker">S&P 500 Index 2021-2023</h1>

      <div className="chart">
        <Chart
          options={chart.options}
          series={series}
          type="candlestick"
          width={1000}
          height={500}
        />
      </div>
    </div>
  );
}

export default App;
