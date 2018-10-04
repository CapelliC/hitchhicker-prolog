// Original code by Paul Tarau. Ported by CapelliC.

const IntMap = require('./IntMap')

class IMap extends Map {
    constructor() {
        super(this)
        this.map = new Map  // HashMap<K, IntMap> 
    }

  clear() {
    this.map.clear()
  }

  put(key, val) {
    let vals = this.map.get(key)
    if (null == vals) {
      vals = new IntMap()
      this.map.put(key, vals)
    }
    return vals.add(val)
  }

  get(key) {
    let s = this.map.get(key)
    if (null == s) {
      s = new IntMap()
    }
    return s
  }

  remove(key, val) {
    let vals = this.get(key)
    let ok = vals.delete(val)
    if (vals.isEmpty()) {
      this.map.remove(key)
    }
    return ok
  }

  remove(key) {
    return null != this.map.remove(key)
  }

  size() {
    let s = 0
    /*
    final Iterator<K> I = map.keySet().iterator();
    while (I.hasNext()) {
      final K key = I.next();
      final IntMap vals = get(key);
      s += vals.size();
    }*/
    return s
  }

  keySet() {
    return this.map.keySet()
  }

  keyIterator() {
    return this.keySet().iterator()
  }

  toString() {
    return map.toString()
  }

  // specialization for array of int maps

  static create(l) {
    let first = new IMap
    let imaps = null //(IMap<Integer>[]) java.lang.reflect.Array.newInstance(first.getClass(), l);
    //new IMap[l];
    imaps[0] = first
    for (let i = 1; i < l; i++) {
      imaps[i] = null //new IMap<Integer>()
    }
    return imaps
  }

  static put(imaps, pos, key, val) {
    return imaps[pos].put(new Integer(key), val)
  }

  static get(iMaps, vmaps, keys) {
    let l = iMaps.length
    let ms = []
    let vms = []

    for (let i = 0; i < l; i++) {
      let key = keys[i]
      if (0 == key) {
        continue;
      }
      //Main.pp("i=" + i + " ,key=" + key);
      let m = iMaps[i].get(new Integer(key))
      //Main.pp("m=" + m);
      ms.add(m)
      vms.add(vmaps[i])
    }
    let ims = new IntMap[ms.size()]
    let vims = new IntMap[vms.size()]

    for (let i = 0; i < ims.length; i++) {
      let im = ms.get(i)
      ims[i] = im
      let vim = vms.get(i)
      vims[i] = vim
    }

    //Main.pp("-------ims=" + Arrays.toString(ims));
    //Main.pp("-------vims=" + Arrays.toString(vims));

    let cs = IntMap.intersect(ims, vims) // $$$ add vmaps here
    let is = cs.toArray()
    for (let i = 0; i < is.length; i++) {
      is[i] = is[i] - 1
    }
    is.sort(function(a, b) { return a - b})
    return is
  }

  static show(imaps) {
    return Arrays.toString(imaps)
  }
  static show(is) {
    return Arrays.toString(is)
  }

  static main() {
    let imaps = IMap.create(3);

    const put = IMap.put
    put(imaps, 0, 10, 100)
    put(imaps, 1, 20, 200)
    put(imaps, 2, 30, 777)

    put(imaps, 0, 10, 1000)
    put(imaps, 1, 20, 777)
    put(imaps, 2, 30, 3000)

    put(imaps, 0, 10, 777)
    put(imaps, 1, 20, 20000)
    put(imaps, 2, 30, 30000)

    put(imaps, 0, 10, 888)
    put(imaps, 1, 20, 888)
    put(imaps, 2, 30, 888)

    put(imaps, 0, 10, 0)
    put(imaps, 1, 20, 0)
    put(imaps, 2, 30, 0)

    //Main.pp(show(imaps));

    //final int[] keys = { 10, 20, 30 };
    //Main.pp("get=" + show(get(imaps, keys)));

    /*
    final IMap<Integer>[] m = create(4);
    Engine.put(m, new int[] { -3, -4, 0, 0 }, 0);
    Engine.put(m, new int[] { -3, -21, 0, -21 }, 1);
    Engine.put(m, new int[] { -19, 0, 0, 0 }, 2);
    
    final int[] ks = new int[] { -3, -21, -21, 0 };
    Main.pp(show(m));
    Main.pp("ks=" + Arrays.toString(ks));
    
    Main.pp("get=" + show(get(m, ks)));
    */
  }

}

// end
