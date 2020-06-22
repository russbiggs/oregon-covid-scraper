const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs').promises;

async function scrape() {
    const url = 'https://govstatus.egov.com/OR-OHA-COVID-19';
    const response = await axios.get(url);
    const select = cheerio.load(response.data);
    const stateCases = getStatewideCases(select);
    const stateDeaths = getStatewideDeaths(select);
    const countyNames = getCountyNames(select);
    const countyCases = getCountyCases(select);
    const countyDeaths = getCountyDeaths(select);
    const countyArr = countyNames.map((curr, idx) => {
        return {
            name: curr,
            cases: countyCases[idx],
            deaths: countyDeaths[idx]
        }
    });
    return JSON.stringify({
        statewideTotal: stateCases,
        statewideDeaths: stateDeaths,
        counties: countyArr
    });
}

function getStatewideCases(select) {
    const selector = '#collapseCases > div > table > tbody > tr:nth-child(1) > td.table-warning > b';
    const elem = select(selector);
    const stateCasesString = elem.clone().children().remove().end().text();
    const stateCases = stringToInt(stateCasesString);
    return stateCases;
}

function getStatewideDeaths (select) {
    const selector = '#collapseCases > div > table > tbody > tr:nth-child(2) > td:nth-child(2)';
    const elem = select(selector);
    const stateDeathsString = elem.text();
    const stateDeaths = stringToInt(stateDeathsString);
    return stateDeaths;
}

function getCountyNames(select) {
    const selector = '#collapseDemographics > div > table:nth-child(1) > tbody > tr > td:nth-child(1)';
    const rows = select(selector);
    const names = [];
    rows.each((_i, elem) => {
        names.push(select(elem).text())
    })
    names.pop(); // pop total row
    return names;
}

function getCountyCases(select) {
    const selector = '#collapseDemographics > div > table:nth-child(1) > tbody > tr > td:nth-child(2)';
    const rows = select(selector);
    let cases = [];
    rows.each((_i, elem) => {
        cases.push(stringToInt(select(elem).text()))
    })
    cases.pop() // pop total row
    return cases;
}

function getCountyDeaths(select) {
    const selector = '#collapseDemographics > div > table:nth-child(1) > tbody > tr > td:nth-child(3)';
    const rows = select(selector);
    deaths = [];
    rows.each((_idx, elem) => {
        deaths.push(stringToInt(select(elem).text()));
    });
    deaths.pop(); // pop total row
    return deaths;
}

function stringToInt(str){
    const newString = str.replace(/\,/g, '');
    return parseInt(newString);
}

scrape().then(data => {
    fs.writeFile('./data.json', data);
})
