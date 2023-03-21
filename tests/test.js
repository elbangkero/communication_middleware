// Create an array of Promises for the inner loop
const innerPromises = outerArray.map(outerItem => {
  return new Promise((resolve, reject) => {
    innerArray.forEach(innerItem => {
      // Do something with each inner item
      
      resolve();
    });
  });
});

// Wait for all inner Promises to resolve
Promise.all(innerPromises).then(() => {
  console.log('Both loops are done');
});
