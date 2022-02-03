/*
 * Concept IRI handling code.
 */

const fs = require('fs');
const path = require('path');

/**
 * A class for converting FHIR Codings into RDF.
 */
class ConceptIRI {
  /**
   * Ideally, we'll eventually have some kind of prefix index within hl7.terminology.
   * Until we have that, we have to index that package ourselves. We do that when this
   * class is constructed so that further calls to this method should be fast.
   */
  constructor() {
    let package_json_path = require.resolve('hl7.terminology/package.json');
    if (!package_json_path) {
      throw new Error("ConceptIRI requires 'hl7.terminology' to be installed.");
    }
    let hl7terminology_path = path.dirname(package_json_path);

    // Initialize prefix indexes.

    // The prefixIndex will be in the form this.prefixIndex[prefix][uri] = 1
    this.prefixIndex = {};

    // The uriIndex will be in the form this.uriIndex[uri][prefix] = 1
    this.uriIndex = {};

    // Load all CodeSystem and Naming files from the hl7terminology path and look for prefix information.
    let files = fs.readdirSync(hl7terminology_path);
    files
      .filter(filename => filename.endsWith('.json') && (
          filename.startsWith('CodeSystem-') ||
          filename.startsWith('NamingSystem-')
      ))
      .forEach(filename => {
        let raw = fs.readFileSync(path.join(hl7terminology_path, filename), "utf-8");
        let content = JSON.parse(raw);

        if (filename.startsWith('CodeSystem-')) {
          let url = content.url;

          (content.identifier || []).forEach(id => {
            if (id.system === 'https://terminology.hl7.org/temporary/CodeSystem/RDF-prefix') {
              // console.log(`CodeSystem ${url} has prefix ${id.value})`);
              if (!this.prefixIndex.hasOwnProperty(id.value)) this.prefixIndex[id.value] = {};
              this.prefixIndex[id.value][url] = 1;

              if (!this.uriIndex.hasOwnProperty(url)) this.uriIndex[url] = {};
              this.uriIndex[url][id.value] = 1;
            }
          });
        } else if(filename.startsWith('NamingSystem-')) {
          // Find uri.
          let uris = (content.uniqueId || []).filter(id => id.type === 'uri').map(id => id.value);

          // Find uniqueId.
          (content.uniqueId || []).forEach(id => {
            uris.forEach(uri => {
              if (id.comment === 'rdf-prefix') {
                if (!this.prefixIndex.hasOwnProperty(id.value)) this.prefixIndex[id.value] = {};
                this.prefixIndex[id.value][uri] = 1;

                if (!this.uriIndex.hasOwnProperty(uri)) this.uriIndex[uri] = {};
                this.uriIndex[uri][id.value] = 1;

                // console.log(`NamingSystem ${uri} has prefix ${id.value}`);
              }
            });
          });
        }
      });

      // console.log(`Prefix Index: ${JSON.stringify(this.prefixIndex)}`);
      // console.log(`URI Index: ${JSON.stringify(this.uriIndex)}`);
  }

  /**
   * A static method for converting a FHIR Coding to a Concept IRI.
   *
   * @param coding A FHIR Coding as an object.
   * @return A list of Concept IRIs as strings; empty list if not present.
   */
  fromCoding(coding) {
    let system = coding.system || '';
    if (system in this.uriIndex) return Object.keys(this.uriIndex[system]).map(key => key + coding.code);
    return [];
  }

  /**
   * A static method for converting a Concept IRI to a FHIR Coding.
   *
   * @param iri A concept IRI.
   * @return A list of FHIR Codings as objects.
   */
  toCoding(iri) {
    // We assume that the code is either after the last '/' or the last '#'
    let prefix = undefined;
    let code = undefined;
    if (iri.lastIndexOf('#') !== -1) {
      prefix = iri.substr(0, iri.lastIndexOf('#') + 1);
      code = iri.substr(iri.lastIndexOf('#') + 1);
    } else if(iri.lastIndexOf('/') !== -1) {
      prefix = iri.substr(0, iri.lastIndexOf('/') + 1);
      code = iri.substr(iri.lastIndexOf('/') + 1);
    } else {
      console.log(`Could not determine coding for IRI '{iri}': could not separate code and baseURI.`);
      return [];
    }

    // console.log(`Split IRI into baseURI=${baseUri} and code=${code}`)

    if (prefix in this.prefixIndex) {
      return Object.keys(this.prefixIndex[prefix]).map(uri => {
        return {
          system: uri,
          code,
        };
      });
    }

    return [];
  }
}

if (typeof module !== 'undefined')
  module.exports = {ConceptIRI};
