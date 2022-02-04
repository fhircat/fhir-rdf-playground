let { ConceptIRI } = require('../ConceptIRI.js');
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

// Let's test every system/value pair in the JSON file.
test('Test every system/value pair in the FHIR JSON examples', () => {
    let package_json_path = require.resolve('hl7.terminology/package.json');
    if (!package_json_path) {
      throw new Error("ConceptIRI requires 'hl7.terminology' to be installed.");
    }
    let hl7terminology_path = path.dirname(package_json_path);

    // Load all CodeSystem and Naming files from the hl7terminology path and look for prefix information.
    let files = fs.readdirSync(hl7terminology_path);

    // TODO: use glob() to find all JSON files and stuff.
});
