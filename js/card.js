// Copyright 2020, Zaven Nahapetyan

class Card {
  static get WIDTH() {
    return 150;
  }

  static get HEIGHT() {
    return 210;
  }

  static get SUITES() {
    return ['C', 'D', 'H', 'S'];
  }

  static get RANKS() {
    return [
      '2', '3', '4', '5', '6', '7', '8', '9',
      '10', 'J', 'Q', 'K', 'A'
    ];
  }

  constructor(id, rotation, x, y, freed, rank, suite) {
    this.id = id;
    this.rotation = rotation;
    this.x = x;
    this.y = y;
    this.freed = freed;
    this.rank = rank;
    this.suite = suite;
  }

  getEdges() {
    // Add tiny rotation otherwise the slope of vertical line is undefined.
    if (Number.isInteger(2 * this.rotation / Math.PI)) {
      this.rotation += 0.01;
    }
    const a = Card.HEIGHT * Math.cos(this.rotation);
    const b = Card.WIDTH * Math.sin(this.rotation);
    const c = Card.WIDTH * Math.cos(this.rotation);
    const d = Card.HEIGHT * Math.sin(this.rotation);
    const p1x = this.x - (c + d) / 2;
    const p1y = this.y + (a - b) / 2;
    const p2x = this.x - (d - c) / 2;
    const p2y = this.y + (a + b) / 2;
    const p3x = this.x + (c + d) / 2;
    const p3y = this.y - (a - b) / 2;
    const p4x = this.x + (d - c) / 2;
    const p4y = this.y - (a + b) / 2;
    const slope1 = b / c;
    const slope2 = a / d;
    return {
      slope1, slope2, p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y,
    };
  }

  intersects(tapX, tapY) {
    const e = this.getEdges();
    const l1 = (x) => x * e.slope1 - e.p1x * e.slope1 + e.p1y;
    const l2 = (x) => -x * e.slope2 + e.p3x * e.slope2 + e.p3y;
    const l3 = (x) => -x * e.slope2 + e.p1x * e.slope2 + e.p1y;
    const l4 = (x) => x * e.slope1 - e.p3x * e.slope1 + e.p3y;
    const s1 = Math.sign(Math.sin(this.rotation));
    const s2 = Math.sign(Math.cos(this.rotation));
    return s2 * tapY < s2 * l1(tapX) && s1 * tapY < s1 * l2(tapX)
      && s1 * tapY > s1 * l3(tapX) && s2 * tapY > s2 * l4(tapX);
  }

  distanceFromCenter() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  draw(ctx, cardBackImage, cardFaceImages) {
    let width = Card.WIDTH;
    let height = Card.HEIGHT;
    if (this.freed) {
      width *= 1.5;
      height *= 1.5;
    }
    // Bring canvas rendering to center of card and rotate there.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.translate(-width / 2, -height / 2);

    if (this.rank == null || this.suite == null) {
      ctx.drawImage(cardBackImage, 0, 0, width, height);
    } else {
      const image = cardFaceImages[this.rank][this.suite];
      ctx.drawImage(image, 0, 0, width, height);
    }

    ctx.restore();
  }
}

if (typeof module !== 'undefined') {
  module.exports = Card;
}
