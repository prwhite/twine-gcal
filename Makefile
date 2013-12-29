help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

npm-app00:            ## Install module deps for app00
	npm install google-calendar passport passport-google-oauth express ejs

npm-app01:            ## Install module deps for app01
	npm install google-calendar google-oauth-serviceaccount express

app01:                ## Run the app detached in the background
	nohup app01.js &

PHONY: app01
