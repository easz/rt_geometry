var RTGEO = (function () {

  var degree_to_rad = function (deg) {
    return deg * Math.PI / 180.0;
  };

  var rad_to_degree = function (rad) {
    return rad * 180.0 / Math.PI;
  };

  // right-handed convention

  // Rz * Ry * Rx
  var to_Euler_XYZ_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
    var c1, c2, c3, s1, s2, s3;
    c1 = Math.cos(rotX); s1 = Math.sin(rotX) * -1.0;
    c2 = Math.cos(rotY); s2 = Math.sin(rotY) * -1.0;
    c3 = Math.cos(rotZ); s3 = Math.sin(rotZ) * -1.0;
    var m = new THREE.Matrix4();
    m.set(c2 * c3, c2 * s3, -s2, 0,
      s1 * s2 * c3 - c1 * s3, s1 * s2 * s3 + c1 * c3, c2 * s1, 0,
      c1 * s2 * c3 + s1 * s3, c1 * s2 * s3 - s1 * c3, c2 * c1, 0,
      0, 0, 0, 1);
    return m;
  };

  // Rz * Ry * Rx
  var to_Euler_XYZ_Vector4 = function (m/*Matrix4*/) {
    var te = m.elements;
    var m11 = te[0], m12 = te[4], m13 = te[8];
    var m21 = te[1], m22 = te[5], m23 = te[9];
    var m31 = te[2], m32 = te[6], m33 = te[10];

    var _x, _z;
    var _y = Math.asin(-(m13 < -1 ? -1 : (m13 > 1 ? 1 : m13)));

    if (Math.abs(m13) < 0.99999) {
      _x = Math.atan2(-m23, m33);
      _z = Math.atan2(-m12, m11);
    } else {
      _x = Math.atan2(m32, m22);
      _z = 0;
    }
    return new THREE.Vector4(_x, _y, _z);
  };

  // Rx * Ry * Rz
  var to_Euler_ZYX_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
    var c1, c2, c3, s1, s2, s3;
    c1 = Math.cos(rotX); s1 = Math.sin(rotX) * -1.0;
    c2 = Math.cos(rotY); s2 = Math.sin(rotY) * -1.0;
    c3 = Math.cos(rotZ); s3 = Math.sin(rotZ) * -1.0;
    var m = new THREE.Matrix4();
    m.set(c3 * c2, s3 * c1 + c3 * s2 * s1, s3 * s1 - c3 * s2 * c1, 0,
      -s3 * c2, c3 * c1 - s3 * s2 * s1, c3 * s1 + s3 * s2 * c1, 0,
      s2, -s1 * c2, c1 * c2, 0,
      0, 0, 0, 1);
    return m;
  }

  // Rx * Ry * Rz
  var to_Euler_ZYX_Vector4 = function (m/*Matrix4*/) {
    var te = m.elements;
    var m11 = te[0], m12 = te[4], m13 = te[8];
    var m21 = te[1], m22 = te[5], m23 = te[9];
    var m31 = te[2], m32 = te[6], m33 = te[10];

    var _x, _z;
    var _y = Math.asin(-(m31 < -1 ? -1 : (m31 > 1 ? 1 : m31)));

    if (Math.abs(m31) < 0.99999) {
      _x = Math.atan2(m32, m33);
      _z = Math.atan2(m21, m11);
    } else {
      _x = 0;
      _z = Math.atan2(- m12, m22);
    }
    return new THREE.Vector4(_x, _y, _z);
  }

  // Rz * Rx * Ry
  var to_Euler_YXZ_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
    var c1, c2, c3, s1, s2, s3;
    c1 = Math.cos(rotX); s1 = Math.sin(rotX) * -1.0;
    c2 = Math.cos(rotY); s2 = Math.sin(rotY) * -1.0;
    c3 = Math.cos(rotZ); s3 = Math.sin(rotZ) * -1.0;
    var m = new THREE.Matrix4();
    m.set(c2 * c3 - s2 * s1 * s3, c2 * s3 + s2 * s1 * c3, -c1 * s2, 0,
      -c1 * s3, c1 * c3, s1, 0,
      s2 * c3 + c2 * s1 * s3, s2 * s3 - c2 * s1 * c3, c2 * c1, 0,
      0, 0, 0, 1);
    return m;
  }

  // Rz * Rx * Ry
  var to_Euler_YXZ_Vector4 = function (m/*Matrix4*/) {
    var te = m.elements;
    var m11 = te[0], m12 = te[4], m13 = te[8];
    var m21 = te[1], m22 = te[5], m23 = te[9];
    var m31 = te[2], m32 = te[6], m33 = te[10];

    var _y, _z;
    var _x = Math.asin(m23 < -1 ? -1 : (m23 > 1 ? 1 : m23));

    if (Math.abs(m23) < 0.99999) {
      _y = Math.atan2(m13, m33);
      _z = Math.atan2(m21, m22);
    } else {
      _y = Math.atan2(-m31, m11);
      _z = 0;
    }
    return new THREE.Vector4(_x, _y, _z);
  }

  // Ry * Rx * Rz
  var to_Euler_ZXY_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
    var c1, c2, c3, s1, s2, s3;
    c1 = Math.cos(rotX); s1 = Math.sin(rotX) * -1.0;
    c2 = Math.cos(rotY); s2 = Math.sin(rotY) * -1.0;
    c3 = Math.cos(rotZ); s3 = Math.sin(rotZ) * -1.0;
    var m = new THREE.Matrix4();
    m.set(c3 * c2 + s3 * s2 * s1, s3 * c1, -c3 * s2 + s3 * s1 * c2, 0,
      -s3 * c2 + c3 * s1 * s2, c1 * c3, s3 * s2 + c3 * s1 * c2, 0,
      c1 * s2, -s1, c1 * c2, 0,
      0, 0, 0, 1);
    return m;
  }

  // Ry * Rx * Rz
  var to_Euler_ZXY_Vector4 = function (m/*Matrix4*/) {
    var te = m.elements;
    var m11 = te[0], m12 = te[4], m13 = te[8];
    var m21 = te[1], m22 = te[5], m23 = te[9];
    var m31 = te[2], m32 = te[6], m33 = te[10];

    var _y, _z;
    var _x = Math.asin(m32 < -1 ? -1 : (m32 > 1 ? 1 : m32));

    if (Math.abs(m32) < 0.99999) {
      _y = Math.atan2(-m31, m33);
      _z = Math.atan2(-m12, m22);
    } else {
      _y = 0;
      _z = Math.atan2(m21, m11);
    }
    return new THREE.Vector4(_x, _y, _z);
  }

  return {

    degree_to_rad: degree_to_rad,
    rad_to_degree: rad_to_degree,

    to_Euler_XYZ_Matrix4: to_Euler_ZXY_Matrix4,
    to_Euler_XYZ_Vector4: to_Euler_ZXY_Vector4,
    to_Euler_ZYX_Matrix4: to_Euler_ZXY_Matrix4,
    to_Euler_ZYX_Vector4: to_Euler_ZXY_Vector4,

    to_Euler_YXZ_Matrix4: to_Euler_ZXY_Matrix4,
    to_Euler_YXZ_Vector4: to_Euler_ZXY_Vector4,
    to_Euler_ZXY_Matrix4: to_Euler_ZXY_Matrix4,
    to_Euler_ZXY_Vector4: to_Euler_ZXY_Vector4
  }
})();