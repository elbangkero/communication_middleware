let values = ["apple", "banana"];

let combinedResults = [];

function addToCombinedResults(el) {
  combinedResults.push(el);

  if (combinedResults.length === 5) {
    console.log("Final Array:", [...combinedResults]); // Log batch
    combinedResults = []; // Reset array
  }
}

// Process each string value
values.forEach(el => {
  addToCombinedResults(el);
});

// Log remaining items if any
if (combinedResults.length > 0) {
  console.log("Final Array:", [...combinedResults]);
}
