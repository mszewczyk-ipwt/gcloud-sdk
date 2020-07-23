const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const url = require('url');
const https = require('https');
const cprocess = require('child_process')

const available_versions = [
  '295.0.0',
  '296.0.0',
  '296.0.1',
  '297,0.0',
  '297.0.1',
  '298.0.0',
  '299.0.0',
  '300.0.0',
  '301.0.0',
  '302.0.0'
]
const download_dir = `${__dirname}/.gcloudsdk`
const download_file = `${download_dir}/gcloud-sdk.tar.gz`
const gcloud_credentials_file = `${download_dir}/creds`


function create_dir(directory) {
  fs.mkdir(
    directory,
    (err) => {
      if (err) {
        throw err;
      }
    }
  )
}

function download_gcloud_sdk(version) {
  if (available_versions.includes(version)) {
    console.log(`Downloading GCloud SDK version ${version}`);
    create_dir(
      download_dir
    )
    download_url = `https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${version}-linux-x86_64.tar.gz`
    const options = {
      host: url.parse(download_url).host,
      port: 443,
      path: url.parse(download_url).pathname
    }
    var file = fs.createWriteStream(download_file);
    https.get(
      options,
      function(res) {
        res.on(
          'data',
          function(data) {
            file.write(data);
          }
        ).on(
          'end',
          function() {
            file.end();
            console.log(`File ${download_url} downloaded successfully`);
            unarchive_gcloud_sdk();
          }
        )
      }
    )
  } else {
    console.error(`cannot find version ${version}`)
    process.exit(1)
  }
}

function unarchive_gcloud_sdk() {
  console.log(`Unarchiving file ${download_file}`)
  cprocess.exec(`tar -C ${download_dir} -xzf ${download_file}`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`);
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
    }
    init_gcloud_sdk();
  }
  );
}

function init_gcloud_sdk() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = gcloud_credentials_file
  process.env.CLOUDSDK_CORE_DISABLE_PROMPTS = '1'
  process.env.PROJECTID = core.getInput('project-id')
  const credentials_base64 = core.getInput('credentials')
  const buff = Buffer.from(
    credentials_base64,
    'base64'
  )
  fs.writeFile(
    gcloud_credentials_file,
    buff,
    (err) => {
      if (err) throw err;
    }
  )
  export_path()
}

function export_path() {
  core.addPath(download_dir + '/google-cloud-sdk/bin')
}

try {
  const version = core.getInput('version')
  download_gcloud_sdk(version);
} catch (error) {
  core.setFailed(error.message);
}