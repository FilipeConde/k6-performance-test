import http from 'k6/http'
import {check, sleep} from 'k6'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { Trend, Rate, Counter } from "k6/metrics";

export let homepageAccessDuration = new Trend('homepage_access_duration');
export let homepageAccessFailRate =  new Rate('homepage_access_fail_rate');
export let homepageAccessSuccessRate =  new Rate('homepage_access_success_rate');
export let homepageAccessReqs = new Rate('homepage_access_reqs');

// set scenarios for the tests
const stagesDemo = {
  thresholds: {
    homepage_access_fail_rate: ['rate<0.02'], // http errors should be less than 2%
    homepage_access_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms
  },
  stages: [
    {duration: '3s', target: 5},   // duration is the time until the ammount  of VUs
    {duration: '3s', target: 10},  // target is the ammount of VUs at the end of the stage
    {duration: '3s', target: 3}
  ]
}

const URL_TEST = 'http://test.k6.io/contacts.php'

// set parameters like _header_ when necessary or comment this block
const PARAMS = {
  headers: {
    'Authorization': 'Bearer FrE4KyEx4Mp1e'
    //'Content-Type': 'application/json',
  },
};

// set report generation
export function handleSummary(data) {
  let obj = {}
  let summaryTitle = "test.html"
  obj[summaryTitle] = htmlReport(data)
  return obj;
}

export const options = stagesDemo
export default function () {

  const res = http.get(URL_TEST, PARAMS)
  sleep(1)

  // set these adjustments to the test case

  homepageAccessDuration.add(res.timings.duration)
  homepageAccessReqs.add(1)
  homepageAccessFailRate.add(res.status != 200)
  homepageAccessSuccessRate.add(res.status == 200)

  // custom checks for each request
  const checkOutput = check(
    res,
    {
      'statuscode is 200': (res) => res.status == 200,
      // 'duration is under 1s': (res) => res.timings.duration < 1000
    }
  )
  
  // log errors if fail the check
  if(!checkOutput) {
    console.log(`Statuscode error => ${res.status}`)
    //console.log(res)
  }
}