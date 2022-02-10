const { ConceptIRI } = require('../ConceptIRI.js');
const { has } = require('lodash');
const path = require("path");
const fs = require("fs");

let examples = {
  'https://purl.bioontology.org/ontology/SNOMEDCT/87512008': [{
    system: "http://snomed.info/sct",
    code: "87512008",
    // "display": "Mild major depression"
  }],
  'https://www.omg.org/spec/LCC/Countries/ISO3166-1-CountryCodes/CA': [{
    system: "urn:iso:std:iso:3166:-2", // This looks weird, but it is real: https://terminology.hl7.org/CodeSystem-v3-iso3166-2.html
    code: "CA",
  }, {
    system: "urn:iso:std:iso:3166",
    code: "CA",
  }],
  'http://dicom.nema.org/resources/ontology/DCM/110127': [{
    system: 'http://dicom.nema.org/resources/ontology/DCM',
    code: '110127',
  }],
  'http://purl.bioontology.org/ontology/RXNORM/1160593': [{
    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
    code: '1160593',
  }],
};

let conceptIRI = new ConceptIRI();

test('Convert some FHIR Codings to IRIs', () => {
    for (let iri in examples) {
        let codings = examples[iri];

        codings.forEach(coding => {
            expect(conceptIRI.fromCoding(coding)).toEqual([iri]);
        });
    }
});

test('Convert some Concept IRIs to FHIR Codings', () => {
    for (let iri in examples) {
        let coding = examples[iri];

        expect(conceptIRI.toCoding(iri).sort()).toEqual(coding.sort());
    }
});

// Return all JSON files recursively in a directory.
function get_files_in_dir(dirname, filter=(filename) => true, recursive=true) {
    let files = fs.readdirSync(dirname);
    let output_files = [];
    files.forEach(file => {
       let filename = path.resolve(dirname, file);
       let ls = fs.lstatSync(filename);
       if(ls.isDirectory()) {
           if (recursive)
               output_files = output_files.concat(get_files_in_dir(filename, filter, recursive));
           else
               if (filter(filename)) output_files.push(filename);
       } else if(ls.isFile()) {
            if (filter(filename)) output_files.push(filename);
       } else {
           throw new Error(`File ${file} in directory ${dirname} is neither a file nor a directory.`);
       }
    });
    return output_files;
}

function get_system_code_pairs_from_file(filename, inner_object = undefined, obj_path='') {
    // The conventional thing to do would be to find all the Codings; however, to
    // ensure that we don't miss anything, I'm just going to search recursively for
    // every system/code pair anywhere in any of these files.

    // console.log(`get_system_code_pairs_from_file(${filename}, ${inner_object}, ${obj_path})`);

    let obj = inner_object;
    if (!obj) {
        obj = JSON.parse(fs.readFileSync(filename, "utf-8"));
    }

    let results = [];

    // Does obj have a system/code pair?
    if (has(obj, 'system') && has(obj, 'code')) {
        const result = /(\w+\.\w+)(?:\.\d+)$/.exec(obj_path);
        const path_end = (result ? result[1] : '');

        results.push({
            filename,
            object: obj,
            path: obj_path,
            path_end,
            display: obj['display'] || '',
            system: obj['system'],
            code: obj['code'],
        });
    }

    // Recurse into any properties of obj that are themselves objects.
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value != null) {
            results = results.concat(get_system_code_pairs_from_file(filename, value, `${obj_path}.${key}`))
        }
    }

    return results;
}

/*
 * Test for all the files in a FHIR JSON examples directory.
 * The path should either point to the v4 or v5 directory.
 */
function test_fhir_json(fhir_json_path) {
    // Step 1.  Find every system/code pair in the FHIR JSON examples.
    // The conventional thing to do would be to find all the Codings; however, to
    // ensure that we don't miss anything, I'm just going to search recursively for
    // every system/code pair anywhere in any of these files.
    let fhir_jsons = get_files_in_dir(fhir_json_path, (filename) => filename.toLowerCase().endsWith('.json'), true);
    expect(fhir_jsons.length).toBeGreaterThan(0);

    // Step 2. Open each file and recurse through every object.
    let system_code_pairs = fhir_jsons.flatMap(filename => {
        // console.log(`Searching for code pairs for {filename}.`);
        return get_system_code_pairs_from_file(filename);
    });

    // Step 3. Write out a tab-delimited file containing all the relevant information.
    let f = fs.createWriteStream(path.resolve(__dirname, 'fhir/examples/system-codes.tsv'), 'utf-8');
    f.write('filename\tpath\tpath_end\tsystem\tcode\tdisplay\n');
    system_code_pairs.forEach(result => {
        f.write([
            result.filename,
            result.path,
            result.path_end,
            result.system,
            result.code,
            result.display
        ].join('\t') + '\n')
    })
    f.close();
}

// Let's test every system/value pair in the FHIR JSON R4 files.
test('Test every system/value pair in the FHIR JSON R4 examples', () => {
    test_fhir_json(path.resolve(__dirname, 'fhir/examples/fhir-r4'));
});

// Let's test every system/value pair in the FHIR JSON R5 files.
test('Test every system/value pair in the FHIR JSON R5 examples', () => {
    test_fhir_json(path.resolve(__dirname, 'fhir/examples/fhir-r5'));
});

