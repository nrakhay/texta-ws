export const getWeather = async (location, units = "metric") => {
  console.log(location, units);
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPENWEATHER_API_KEY}&units=${units}`
  );
  const data = await response.json();

  return data;
};
