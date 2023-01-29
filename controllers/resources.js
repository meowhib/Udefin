const Resource = require('../models/resource');

exports.getResources = async (req, res) => {
  const resources = await Resource.find({});

  return res.send(resources);
};

exports.getResource = async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).send('Resource not found');
  } else {
    return res.send(resource);
  }
};

exports.deleteResource = async (req, res) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);

  if (!resource) {
    return res.status(404).send('Resource not found');
  } else {
    return res.status(200).send('Resource deleted');
  }
};