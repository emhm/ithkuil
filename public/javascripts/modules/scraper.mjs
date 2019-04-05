// SCRAPER COMPONENTS
// 
// ---- GENERAL UTILITIES ----
//
// 
const getText = el => el.textContent || "";
// 
const textAndElement = el => ({text: getText(el),
			       node: el});
//
// ---- ROOT TABLE UTILITIES ----
// 
// Root tables have a <strong> element in the first row
const getTableRoot = tbl => tbl.querySelector("tr").querySelector("strong");
// Get root text
const getTableRootText = tbl => getText(getTableRoot(tbl));
// Gloss strings should immediately follow the root as a text node
const getTableGlossText = tbl => getText(getTableRoot(tbl).nextSibling);
// Collect all root tables from page
const getAllRootTables = doc => Array.from(doc.querySelectorAll("table"))
      .filter(getTableRoot);
//

const tableToArray = tbl => Array.from(tbl.querySelectorAll("tr")) // table => array of rows...
      .map( tr => Array.from(tr.querySelectorAll("td"))	// row => array of cells
	    .map(textAndElement));				// cell => {text, element}
//
// ---- DERIVED ROOT UTILITIES ----
//
const rootRegExp = /-? ?([^0-9: ]{1,6}) ?-?/;

Array.from(document.querySelectorAll("strong"))
    .filter(strong => /^-? ?[^0-9 :]{1,6} ?-?$/.test(strong.textContent) &&
	    strong.nextSibling &&
	    strong.nextElementSibling)
    .map(strong => ({root: strong.textContent,
		     gloss: strong.nextSibling.textContent,
		     major: strong.nextElementSibling.textContent}));

//
// ---- LEXICON SCRAPER CLASS ----
// 
class LexiconScraper {
    constructor (page) {
	this.page = page;
	this.allRootTables = 
    }
    get rootTables () {
	return getAllRootTables(page)
	    .map(tbl => ({root: getTableRootText(tbl),
			  gloss: getTableGlossText(tbl),
			  node: tbl}));
    }
    get derivedRoots () {
	
    }
}

window.Lexicon = new LexiconScraper(document);
	
