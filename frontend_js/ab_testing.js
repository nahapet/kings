// Copyright 2020, Zaven Nahapetyan

class ABTesting {

  static get EXPERIMENTS() {
    return {
      overlay: 'experiment-overlay',
    };
  }

  constructor() {
    heap.clearEventProperties();
    this.exposures = {};
    this.localCache = {}; // back up if no localStorage
  }

  randBool() {
    return Math.random() < 0.5;
  }

  assignExperiment(id, randFunc) {
    const storage = window.localStorage;
    let result = null;

    if (!storage) {
      result = this.localCache[id];
      if (result == null) {
        result = randFunc();
        this.localCache[id] = result;
      }
    } else {
      result = storage.getItem(id);
      if (result == null) {
        result = randFunc();
        storage.setItem(id, result);
      }
    }

    result = (result == true || result == 'true'); // convert to bool
    heap.addEventProperties({[id]: result});
    if (!this.exposures[id]) {
      this.exposures[id] = true;
      heap.track('Exposure: ' + id);
    }
    return result;
  }

  shouldShowOverlay() {
    const id = ABTesting.EXPERIMENTS.overlay;
    return this.assignExperiment(id, this.randBool);
  }
}

if (typeof module !== 'undefined') {
  module.exports = ABTesting;
}
