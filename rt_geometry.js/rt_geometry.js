var RTGEO = (function () {

  var degree_to_rad = function (deg) {
    return deg * Math.PI / 180.0;
  };

  var rad_to_degree = function (rad) {
    return rad * 180.0 / Math.PI;
  };

  // right-handed convention

  // Rz * Ry * Rx
  var create_Euler_XYZ_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
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
  var create_Euler_ZYX_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
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
  var create_Euler_YXZ_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
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
  var create_Euler_ZXY_Matrix4 = function (rotX/*rad*/, rotY, rotZ) {
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

  var extract_intrinsic_R_T = function (m/*Matrix4*/) {
    //  return: [R, T] from m
    //                      
    //  where m := | R RT |
    //             | 0 1  |
    var R = new THREE.Matrix4();
    R.extractRotation(m);
    var R_inv = new THREE.Matrix4();
    R_inv = R_inv.getInverse(R);
    var RT = new THREE.Vector4(m.elements[12], m.elements[13], m.elements[14]);
    var T = RT.clone();
    T = T.applyMatrix4(R_inv);
    return [R, T];
  };

  /// create a @c THREE.Matrix4 to represent an intrinsic transformation with z-x-y order
  var create_intrinsic_zxy_Matrix4 = function (rotateX/*rad*/, rotateY, rotateZ, translateX, translateY, translateZ) {
    //  return: | R' R'T' |
    //          | 0    1  |
    //
    // where R' := R_(rotateY)*R_(rotateX)*R_(rotateZ)     -> 3x3 Matrix
    //       T' := T_(translateX, translateY, translateZ)  -> 3x1 Vector
    var R1 = create_Euler_ZXY_Matrix4(rotateX, rotateY, rotateZ);
    var T1 = new THREE.Vector4(translateX, translateY, translateZ);
    T1 = T1.applyMatrix4(R1);
    R1.elements[12] = T1.x;
    R1.elements[13] = T1.y;
    R1.elements[14] = T1.z;
    return R1;
  };

  /// create a @c THREE.Matrix4 to represent an isocentric transformation with Z-X-Y order where Z is the fixed axis on the origin
  var create_isocentric_ZXY_Matrix4 = function (rotateX/*rad*/, rotateY, rotateZ, translateX, translateY, translateZ) {
    return create_intrinsic_zxy_Matrix4(rotateX, rotateY, rotateZ, translateX, translateY, translateZ);
  };

  /// create a @c THREE.Matrix4 to represent an intrinsic transfomration (rotation with z-x-y order) following a given @a transfomed transformation
  var create_transformed_intrinsic_zxy_Matrix4 = function (transfomed/*THREE.Matrix4*/, rotateX/*rad*/, rotateY, rotateZ, translateX, translateY, translateZ) {
    //  return: | R'R''   R'T' + R'R''T'' |
    //          | 0                 1     |
    //
    //  where | R'  R'T' | := transfomed
    //        | 0     1  |
    //
    //        R''          := R_(rotateY)*R_(rotateX)*R_(rotateZ)     -> 3x3 Matrix
    //        T''          := T_(translateX, translateY, translateZ)  -> 3x1 Vector    
    var R1 = new THREE.Matrix4();
    R1 = R1.extractRotation(transfomed);
    var R1T1 = new THREE.Vector4(transfomed.elements[12], transfomed.elements[13], transfomed.elements[14]);

    var R2 = create_Euler_ZXY_Matrix4(rotateX, rotateY, rotateZ);
    var T2 = new THREE.Vector4(translateX, translateY, translateZ);

    var M = new THREE.Matrix4();
    M = M.multiplyMatrices(R1, R2);
    T2 = T2.applyMatrix4(R2);
    T2 = T2.applyMatrix4(R1);
    M.elements[12] = R1T1.x + T2.x;
    M.elements[13] = R1T1.y + T2.y;
    M.elements[14] = R1T1.z + T2.z;
    return M;
  };

  return {

    degree_to_rad: degree_to_rad,
    rad_to_degree: rad_to_degree,

    create_Euler_XYZ_Matrix4: create_Euler_ZXY_Matrix4,
    to_Euler_XYZ_Vector4: to_Euler_ZXY_Vector4,
    create_Euler_ZYX_Matrix4: create_Euler_ZXY_Matrix4,
    to_Euler_ZYX_Vector4: to_Euler_ZXY_Vector4,

    create_Euler_YXZ_Matrix4: create_Euler_ZXY_Matrix4,
    to_Euler_YXZ_Vector4: to_Euler_ZXY_Vector4,
    create_Euler_ZXY_Matrix4: create_Euler_ZXY_Matrix4,
    to_Euler_ZXY_Vector4: to_Euler_ZXY_Vector4,

    extract_intrinsic_R_T: extract_intrinsic_R_T,

    create_intrinsic_zxy_Matrix4: create_intrinsic_zxy_Matrix4,
    create_isocentric_ZXY_Matrix4: create_isocentric_ZXY_Matrix4,

    create_transformed_intrinsic_zxy_Matrix4: create_transformed_intrinsic_zxy_Matrix4
  }
})();