function containsNewline(str) {
    if (str.search(/$/m) == -1){
	return false;
    }else{
	return true;
    };
};

function notJustSpace(str) {
    if (str.search(/\S/) == -1){
        return false;
    }else{
        return true;
    };
};

// get a node's text
function text(node) {
    return node.textContent;
};

function isDerivedRoot(text) {
    if (text.search(/pattern of stems|patterned/i) === -1) {
        return false;
    } else {
        return true;
    };
}

function allDerivedRoots() {
    var allP = [].slice.call(
        document.querySelectorAll('p'));
    var filtered = allP.filter(function(node) {
        return isDerivedRoot(text(node));
    });
    var ret = filtered.map(text);
    // filtered.forEach(function(node) {
    //     document.body.removeChild(node);
    // });
    return ret;
};

function checkCombinedEntry(pText) {
    // if it contains a newline...
    if (containsNewline(pText)){
        // split it, eliminating strings consisting only of whitepace
        var potentials = pText.split(/$/m).filter(notJustSpace);
        // returns an array if there is more than one interesting string 
        if (potentials.length > 1) {
            return potentials;
        } else {
            // otherwise returns the only member of the array
            return potentials[0];
        };
    } else {
        // if it doesn't contain a newline, the string is good as is
        return pText;
    };
};

function makeLexEntry(lx, matches, index) {
    var majorRoot = matches[1].slice(1,-1);
    var derivedRoot = matches[0].slice(1,-1);
    // if there is already an entry for this majorRoot...
    if (index.hasOwnProperty(majorRoot)) {
        // put the derivedRoot in the appropriate place
        index[majorRoot].push(lx);
    } else {
        // otherwise make a new entry
        index[majorRoot] = Array.of(lx);
    };
};

function sortRoot(lexText, index, orphans) {
    var matches = lexText.match(/-\S{1,6}-/g);
    if (matches == null){
        orphans.push(lexText);
    } else if (matches.length == 2) {
        makeLexEntry(lexText, matches, index);
        return;
    } else {
        orphans.push(lexText);
    };
};

// create a dictionary of Ithkuil roots
function derivedRoots() {
    // dictionary of major roots and their minor root followers
    var index = {};
    // a bucket for ill-formed strings that need human sorting 
    var orphans = [];
    // collect all derived roots
    var d = allDerivedRoots()
    // split combined entries
        .map(checkCombinedEntry)
    // flatten nested arrays
        .reduce(
            function(acc,val) {
                if (Array.isArray(val)) {
                    acc = acc.concat(val);
                } else {
                    acc.push(val);
                }
                return acc;
            }, []);
    // sort through the collection of roots
    // into the index and orphan containers
    d.forEach(function(lx) {
        sortRoot(lx, index, orphans);
    });
    return {"index": index,
            "orphans": orphans}
};

function isRootTable(tableNode) {
    if (tableNode.querySelector('tr').textContent.search(/^\s*-?\s*\S+?\s*-/) === -1) {
        return false;
    } else {
        return true;
    };
};

function allTableRoots() {
    // get all <TABLE>
    var allTables = [].slice.call(document.querySelectorAll('table'));
    // quick and dirty test to see if it's a root table

    return allTables.filter(isRootTable);

};

function tableToRowArray(tbl) {
    var rows = [].slice.call(tbl.querySelectorAll('tr'));
    var result = [];
    rows.forEach(
        function (row){
            var cells = [].slice.call(row.querySelectorAll('td'));
            result.push(cells.map(
                function(node){
                    return node.textContent;
                }));		
        });
    // document.body.removeChild(tbl);
    return result;    
}

function handleRootAndGloss(str) {
    var rootPattern = /-?\s*(\S+?)\s*-\s*(.*)/;
    var matches = str.match(rootPattern);
    var root = matches[1].replace(/-/g, "");
    var gloss = cleanGloss(matches[2]);
    return {"root": root,
            "gloss": gloss
           };

};

function cleanGloss(gloss) {
    var clean = gloss.replace(/^\W*|\W*$/g, "") // remove quotes
        .replace(/\s\s+/g, " ")			// remove extraneous space
        .toLowerCase();				// lowercase it
    return clean;
}

function isTableHeader(str){
    var searchPattern = /^(\s*(((in)?formal)|(complementary))\s*(stems?)?)?\s*$/i;
    return searchPattern.test(str);
}

function isRowTableHeader(ary) {
    if (ary.map(isTableHeader)
        .includes(false)){
        return false;
    } else {
        return true;
    }
}

// a utility for going over a table
function walkTable(tbl, callback) {
    for (var row = 0; row < tbl.length; row++) {
        for (var col = 0; col < tbl[row].length; col++) {
            // it passes the callback the table,
            // the cell under consideration
            // the row and column number where the cell was found
            callback(tbl, row, col);
        };
    };
};

// IthkuilRoot.prototype.derivedRootsIndex = derivedRoots().index;
// 
const DERIVED_ROOTS = derivedRoots().index;

function makeIthkuilRoot(rowArray) {
    // strip first row from rowArray, parse root & gloss 
    var firstRowContents = rowArray.shift().shift();
    var header = handleRootAndGloss(firstRowContents);
    var root = header.root;
    var gloss = header.gloss;
    // produce a table with header cells removed
    var strippedTable = rowArray.filter(
        // filter rows by what is NOT a table header
        function(row){
            return ! isRowTableHeader(row);
        });
    var table = parseStemTable(strippedTable);
    // search the index for minor roots
    var derived = DERIVED_ROOTS[root];
    return new IthkuilRoot({
        "gloss": gloss,
        "root": root,
        "table": table,
        "derived": derived,
    })
}


function IthkuilRoot(obj) {
    //
    this.gloss = obj.gloss;
    this.root = obj.root;
    this.table = obj.table;
    this.derived = obj.derived;

    return this;
};

Object.defineProperty(IthkuilRoot.prototype, "stems", {
    get: function() {
        return this.table.reduce(
            function(a,b){
                return a.concat(b);
            }).reduce(
                function(a,b){
                    return a.concat(b);});
    }
})

function parseStemTable(table) {
    // make an empty stem table
    function create() {
        var stems = [];
        for (var dsn = 0; dsn < 2; dsn++) {
            var designation = [];
            for (pattern = 0; pattern < 3; pattern++) {
                designation.push(new Array(3));
            };
            stems.push(designation);
        };
        return stems;
    }
    function removeNumbers(str) {
        return str.replace(/^\s*\d+\.?\s*/, "");
    }
    // sort complementary patterns
    function handleComplementaryPatterns(tbl) {
        walkTable(tbl,
                  function(t, row, col) {
                      // informal stems on the left, formal on right
                      var designation = col < 2 ? 0 : 1;
                      // every other col is pattern 1 or pattern 2
                      var pattern = col % 2 + 1;
                      // row is stem
                      var stem = row;
                      var gloss = removeNumbers(t[row][col]);
                      stemTable.set(gloss, designation, pattern, stem)
                  });
    };
    // sort holistic patterns
    function handleHolisticPattern(tbl) {
        var reference;
        walkTable(tbl,
                  function(t, row, col) {
                      var gloss = removeNumbers(t[row][col]);
                      stemTable.set(gloss, col, 0, row);
                      if (row == 0 && col == 1) {
                          // store reference if on row 0 col 1
                          // (i.e. Formal Designation, Pattern 1, Row 1)
                          reference = gloss;
                      } else if (t[row].length < 2) {
                          // if any subsequent row has fewer than two cells
                          // fill them in from the reference string
                          stemTable.set(reference, 1, 0, row);
                      };
                  });
    };
    // setter for the stemtable...
    // 1. takes the gloss found in the table
    // 2. an integer representing informal (0) or formal (1)
    // 3. an integer representing the pattern, 0-2
    // 4. an integer representing the stem number, 0-2
    var stemTable = {
        "stems": create(),
        "set": function(stemGloss, designation, pattern, stem) {
            this.stems[designation][pattern][stem] = stemGloss;
            return this;
        }
    }

    var holistic = table.slice(0,3);
    var complementary = table.slice(3);
    handleHolisticPattern(holistic);
    handleComplementaryPatterns(complementary);

    return stemTable.stems;
}
// makes an empty StemTable

var Ithkuil = {
    DICTIONARY: {
        entries: allTableRoots().map(tableToRowArray)
            .map(makeIthkuilRoot),
        search: function(field, searchTerm){
            // function to test a string based on the given regexp
            function testString(str) {
                var term = new RegExp(searchTerm, "i");
                return term.test(str);
            };
            // 
            function searchTest(entry) {
                // if the field is an array, test to see if any elements contain term
                var fieldData = entry[field];
                if (fieldData instanceof Array) {
                    return fieldData.some(testString);
                } else {
                    return testString(fieldData);
                };
            };
            // 
            return this.entries.filter(searchTest);
        }
    }
}
