// Original code by Paul Tarau. Ported by CapelliC.

/**
 * derived from code at https://github.com/mikvor/hashmapTest
 */
class IntMap {
    
  /*
  private static final int FREE_KEY = 0;
  static final int NO_VALUE = 0;
  */

  /** Keys and values */
  //private int[] m_data;

  /** Do we have 'free' key in the map? */
  //private boolean m_hasFreeKey;
  /** Value of 'free' key */
  //private int m_freeValue;

  /** Fill factor, must be between (0 and 1) */
  //private final float m_fillFactor;
  /** We will resize a map once it reaches this size */
  //private int m_threshold;
  /** Current map size */
  //private int m_size;

  /** Mask to calculate the original position */
  //private int m_mask;
  //private int m_mask2;

  /*
  IntMap() {
    this(1 << 2);
  }

  IntMap(final int size) {
    this(size, 0.75f);
  }
  */
  
  constructor(size_, fillFactor_) {
      size = size_ || 1 << 2
      fillFactor = fillFactor_ || 0.75
      
    if (fillFactor <= 0 || fillFactor >= 1)
      throw new IllegalArgumentException("FillFactor must be in (0, 1)")
      
    if (size <= 0)
      throw new IllegalArgumentException("Size must be positive!")
      
    let capacity = arraySize(size, fillFactor)
    this.m_mask = capacity - 1
    this.m_mask2 = capacity * 2 - 1
    this.m_fillFactor = fillFactor

    this.m_data = new int[capacity * 2]
    this.m_threshold = (capacity * fillFactor)
  }

  get(key) {
    let ptr = (phiMix(key) & m_mask) << 1

    if (key == FREE_KEY)
      return m_hasFreeKey ? m_freeValue : NO_VALUE

    let k = m_data[ptr]

    if (k == FREE_KEY)
      return NO_VALUE //end of chain already
    if (k == key) //we check FREE prior to this call
      return m_data[ptr + 1]

    while (true) {
      ptr = ptr + 2 & m_mask2 //that's next index
      k = m_data[ptr]
      if (k == FREE_KEY)
        return NO_VALUE
      if (k == key)
        return m_data[ptr + 1]
    }
  }

  // for use as IntSet - Paul Tarau

  contains(key) {
    return IntMap.NO_VALUE != this.get(key)
  }

  add(key) {
    return IntMap.NO_VALUE != put(key, 666)
  }

  delete(key) {
    return IntMap.NO_VALUE != this.remove(key)
  }

  isEmpty() {
    return 0 == this.m_size
  }

  static intersect0(m, maps, vmaps, r) {
    let data = m.m_data
    for (let k = 0; k < data.length; k += 2) {
      let found = true
      let key = data[k]
      if (IntMap.FREE_KEY == key) {
        continue
      }
      for (let i = 1; i < maps.length; i++) {
        let map = maps[i]
        let val = this.map.get(key)

        if (IntMap.NO_VALUE == val) {
          let vmap = vmaps[i]
          let vval = vmap.get(key)
          if (IntMap.NO_VALUE == vval) {
            found = false
            break
          }
        }
      }
      if (found) {
        r.push(key)
      }
    }
  }

  static intersect(maps, vmaps) {
    let r = new IntStack()
    intersect0(maps[0], maps, vmaps, r)
    intersect0(vmaps[0], maps, vmaps, r)
    return r
  }

  // end changes

  put(key, value) {
    if (key == IntMap.FREE_KEY) {
      let ret = m_freeValue
      if (!m_hasFreeKey) {
        ++m_size
      }
      this.m_hasFreeKey = true
      this.m_freeValue = value
      return ret
    }

    let ptr = (phiMix(key) & m_mask) << 1
    let k = m_data[ptr]
    if (k == IntMap.FREE_KEY) //end of chain already
    {
      this.m_data[ptr] = key
      this.m_data[ptr + 1] = value
      if (this.m_size >= m_threshold) {
        rehash(this.m_data.length * 2) //size is set inside
      } else {
        ++this.m_size
      }
      return NO_VALUE;
    } else if (k == key) //we check FREE prior to this call
    {
      let ret = m_data[ptr + 1]
      this.m_data[ptr + 1] = value
      return ret
    }

    while (true) {
      ptr = ptr + 2 & this.m_mask2 //that's next index calculation
      k = this.m_data[ptr]
      if (k == IntMap.FREE_KEY) {
        this.m_data[ptr] = key;
        this.m_data[ptr + 1] = value;
        if (this.m_size >= this.m_threshold) {
          rehash(this.m_data.length * 2) //size is set inside
        } else {
          ++this.m_size
        }
        return IntMap.NO_VALUE
      } else if (k == key) {
        let ret = this.m_data[ptr + 1]
        this.m_data[ptr + 1] = value
        return ret
      }
    }
  }

  remove(key) {
    if (key == IntMap.FREE_KEY) {
      if (!this.m_hasFreeKey)
        return IntMap.NO_VALUE
      this.m_hasFreeKey = false
      --m_size
      return m_freeValue //value is not cleaned
    }

    let ptr = (phiMix(key) & m_mask) << 1
    let k = this.m_data[ptr]
    if (k == key) //we check FREE prior to this call
    {
      let res = this.m_data[ptr + 1]
      this.shiftKeys(ptr)
      --this.m_size
      return res
    } else if (k == IntMap.FREE_KEY)
      return IntMap.NO_VALUE //end of chain already
    while (true) {
      ptr = ptr + 2 & this.m_mask2 //that's next index calculation
      k = m_data[ptr]
      if (k == key) {
        let res = m_data[ptr + 1]
        this.shiftKeys(ptr)
        --this.m_size;
        return res
      } else if (k == IntMap.FREE_KEY)
        return IntMap.NO_VALUE
    }
  }

  shiftKeys(pos) {
    // Shift entries with the same hash.
    let last, slot;
    let k;
    let data = this.m_data;
    while (true) {
      pos = (last = pos) + 2 & this.m_mask2;
      while (true) {
        if ((k = data[pos]) == IntMap.FREE_KEY) {
          data[last] = IntMap.FREE_KEY
          return last
        }
        slot = (phiMix(k) & this.m_mask) << 1 //calculate the starting slot for the current key
        if (last <= pos ? last >= slot || slot > pos : last >= slot && slot > pos) {
          break
        }
        pos = pos + 2 & this.m_mask2 //go to the next entry
      }
      data[last] = k
      data[last + 1] = data[pos + 1]
    }
  }

  size() {
    return this.m_size
  }

  rehash(newCapacity) {
    this.m_threshold = (newCapacity / 2 * m_fillFactor)
    this.m_mask = newCapacity / 2 - 1
    this.m_mask2 = newCapacity - 1

    let oldCapacity = this.m_data.length
    let oldData = this.m_data

    this.m_data = new int[newCapacity]
    this.m_size = this.m_hasFreeKey ? 1 : 0

    for (let i = 0; i < oldCapacity; i += 2) {
      let oldKey = oldData[i]
      if (oldKey != IntMap.FREE_KEY) {
        this.put(oldKey, oldData[i + 1])
      }
    }
  }

  /** Taken from FastUtil implementation */

  /** Return the least power of two greater than or equal to the specified value.
   *
   * <p>Note that this function will return 1 when the argument is 0.
   *
   * @param x a long integer smaller than or equal to 2<sup>62</sup>.
   * @return the least power of two greater than or equal to the specified value.
   */
  static nextPowerOfTwo(x) {
    if (x == 0)
      return 1
    x--
    x |= x >> 1
    x |= x >> 2
    x |= x >> 4
    x |= x >> 8
    x |= x >> 16
    return (x | x >> 32) + 1
  }

  /** Returns the least power of two smaller than or equal to 2<sup>30</sup>
   * and larger than or equal to <code>Math.ceil( expected / f )</code>.
   *
   * @param expected the expected number of elements in a hash table.
   * @param f the load factor.
   * @return the minimum possible size for a backing array.
   * @throws IllegalArgumentException if the necessary size is larger than 2<sup>30</sup>.
   */
  static arraySize(expected, f) {
    let s = Math.max(2, nextPowerOfTwo(Math.ceil(expected / f)))
    if (s > 1 << 30)
      throw new IllegalArgumentException("Too large (" + expected + " expected elements with load factor " + f + ")")
    return s
  }

  //taken from FastUtil

  static phiMix(x) {
    let h = x * IntMap.INT_PHI
    return h ^ h >> 16
  }

  toString() {
    //return java.util.Arrays.toString(m_data);
    let b = new StringBuffer("{")
    let l = this.m_data.length
    let first = true
    for (let i = 0; i < l; i += 2) {

      let v = this.m_data[i]
      if (v != IntMap.FREE_KEY) {
        if (!first) {
          b.append(',')
        }
        first = false
        b.append(v - 1)
      }
    }
    b.append("}")
    return b.toString()
  }

}

IntMap.FREE_KEY = 0
IntMap.NO_VALUE = 0
IntMap.INT_PHI = 0x9E3779B9

exports.InpMap = IntMap
