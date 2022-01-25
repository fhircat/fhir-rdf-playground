# A Makefile for downloading FHIR fhir/examples from the FHIR website
# and (eventually) converting them to Turtle to look for differences
# between different FHIR-RDF generators.
# 
# Inspired from https://github.com/FHIRCat/FHIRJsonLDAmiaPaper/
# but (as of today) not using much copied over code.

.PHONY: all clean fhir/examples fhir/examples-download fhir/examples-unzip

all: fhir/examples

clean:
	rm -rf fhir/examples
	mkdir -p fhir/examples/fhir-r4
	mkdir -p fhir/examples/fhir-r5

examples: fhir/examples/downloaded fhir/examples/unzipped

examples/downloaded:
	wget --continue http://www.hl7.org/fhir/examples-json.zip -O fhir/examples/fhir-r4/examples-json.zip
	wget --continue http://www.hl7.org/fhir/examples-ttl.zip -O fhir/examples/fhir-r4/examples-ttl.zip
	wget --continue http://build.fhir.org/examples-json.zip -O fhir/examples/fhir-r5/examples-json.zip
	wget --continue http://build.fhir.org/examples-ttl.zip -O fhir/examples/fhir-r5/examples-ttl.zip

examples/unzipped: fhir/examples/downloaded
	rm -rf fhir/examples/fhir-r4/examples-json
	unzip fhir/examples/fhir-r4/examples-json.zip -d fhir/examples/fhir-r4/examples-json
	rm -rf fhir/examples/fhir-r4/examples-ttl
	unzip fhir/examples/fhir-r4/examples-ttl.zip -d fhir/examples/fhir-r4/examples-ttl
	rm -rf fhir/examples/fhir-r5/examples-json
	unzip fhir/examples/fhir-r5/examples-json.zip -d fhir/examples/fhir-r5/examples-json
	rm -rf fhir/examples/fhir-r5/examples-ttl
	unzip fhir/examples/fhir-r5/examples-ttl.zip -d fhir/examples/fhir-r5/examples-ttl
	touch fhir/examples/unzipped
