const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  }
});

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
