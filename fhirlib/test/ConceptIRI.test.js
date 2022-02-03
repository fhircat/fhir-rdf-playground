let { ConceptIRI } = require('../ConceptIRI.js');

let examples = {
  'http://purl.bioontology.org/ontology/SNOMEDCT/87512008': {
    "system": "http://snomed.info/sct",
    "code": "87512008",
    "display": "Mild major depression"
  },
};

test('Convert some FHIR Codings to IRIs', () => {
    for (let iri in examples) {
        let coding = examples[iri];

        expect(ConceptIRI.fromCoding(coding)).toEqual(iri);
    }
});

test('Convert some Concept IRIs to FHIR Codings', () => {
    for (let iri in examples) {
        let coding = examples[iri];

        expect(ConceptIRI.toCoding(iri)).toEqual(coding);
    }
});
