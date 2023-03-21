function myFunction(test) {
  return new Promise((resolve, reject) => {
    console.log(test)
    resolve();
  });
}


var test = '23131';
myFunction(test)
  .then(() => {
    console.log('success');
  });
