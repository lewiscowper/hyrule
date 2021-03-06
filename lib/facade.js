var DBClient = require('./database_client');
var github = require('octonode');

function Facade(repositoryName) {
  this.repositoryName = repositoryName;
  this.db = new DBClient(repositoryName);
}

Facade.prototype.fetchFromGitHub = function() {
  return new Promise((fullfill, reject) => {
    var client = github.client();
    var ghrepo = client.repo(this.repositoryName);
    ghrepo.issues(function(err, issues) {
      if(err) {
        reject(err);
      } else {
        fullfill(issues);
      }
    });
  });
}

Facade.prototype.initialFetch = function() {
  return this.fetchFromGitHub()
  .then((issues) => {
    return this.db.saveToDatabase(issues);
  })
  .then(() => {
    return this.db.fetchDocuments();
  });
}

Facade.prototype.loadIssues = function() {
  return this.db.fetchDocuments().then((resultSet) => {
    if (resultSet.total_rows > 0) {
      return Promise.resolve(resultSet);
    } else {
      return this.initialFetch();
    }
  })
  .then(function(resultSet) {
    return Promise.resolve(resultSet.rows.map((row) => {
      return row.doc;
    }));
  });
}

Facade.prototype.removeAll = function() {
  return this.db.removeAll();
};

module.exports = Facade;
