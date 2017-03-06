var rt_scene = (function () {

  /* ************************* */
  /* ***** VARIABLES      **** */
  /* ************************* */

  var scene,     /*webgl scene*/
    camera,      /*webgl cam*/
    controls,    /*webgl mouse control*/
    renderer;    /*webgl renderer*/

  var obj_base,       /* Couch Base: it can rotate around fixed Z axe */
    obj_base_target,  // _target represents target position
    obj_couch,        /* Couch: on top of the obj_base, it can move along X/Y/Z axes */
    obj_couch_target,
    obj_robotic,      /* Couch Robotic: on top of the obj_couch, it can rotate around X and Y axes */
    obj_robotic_target,
    obj_top,          /* Couch Top: on top of the obj_robotic, it is fixed with obj_robotic */
    obj_top_target,
    obj_body,         /* Body: on top of the obj_top, it represent a body */
    obj_body_target,
    obj_helper_plane, /* represent a helper plane e.g. a projection of the body onto XY plane */
    obj_model = new THREE.Object3D(), // 3d body model
    obj_model_target = new THREE.Object3D();

  var fps = 30,           /*animation fps*/
    then = Date.now(),    /*the last time the animation is executed*/
    interval = 1000 / fps;/*time interval between animation (ms)*/

  var config_base_world_transf = {// obj_base in world coordinates (fixed on XY plane and rotatable around axis Z)
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: -100.0,
    translateZ: -130.0
  };
  /*
  var config_couch_base_transf = {// obj_couch relative to obj_base
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 0.0
  };
  */
  var config_robotic_couch_transf = {// obj_robotic relative to obj_couch
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 30.0
  };
  var config_top_robotic_transf = {// obj_top relative to obj_robotic
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 50.0,
    translateZ: 15.0
  };
  var config_body_top_transf = {// obj_body relative to obj_top
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 25.0
  };

  var config_material = {// material stuff
    default_opacity: 0.15
  };

  var enum_transf_mode = {// enum
    INTRINSIC_ORIGIN_Zxy: 0,       //
    INTRINSIC_ORIGIN_zxy: 1        //
  };

  // user gui controls
  var ctrl_top_world_transf = {// world coordinates
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: -80.0,
    translateZ: -20.0,
    mode: enum_transf_mode.INTRINSIC_ORIGIN_Zxy
  };
  var ctrl_body_setup_error = {//
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 0.0,
    mode: enum_transf_mode.INTRINSIC_ORIGIN_Zxy
  };
  var ctrl_body_pos_correction_transf = {//
    rotateX: 0.0,
    rotateY: 0.0,
    rotateZ: 0.0,
    translateX: 0.0,
    translateY: 0.0,
    translateZ: 0.0,
    mode: enum_transf_mode.INTRINSIC_ORIGIN_Zxy
  };
  var ctrl_gui = {// gui control
    showHelperPlane: false,
    showModel: true
  };

  /* ************************* */
  /* ***** FUNCTIONS      **** */
  /* ************************* */

  var initControls = function () {
    var gui = new dat.GUI();
    gui.width = 350;

    var folderCouchTop = gui.addFolder('Couch Top Position [world coordinates]');
    folderCouchTop.add(ctrl_top_world_transf, "rotateX", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.add(ctrl_top_world_transf, "rotateY", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.add(ctrl_top_world_transf, "rotateZ", -100.0, 100.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.add(ctrl_top_world_transf, "translateX", -50.0, 50.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.add(ctrl_top_world_transf, "translateY", -120.0, -40.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.add(ctrl_top_world_transf, "translateZ", -60.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.add(ctrl_top_world_transf, "mode", enum_transf_mode).listen().onChange(function () { updateSceneObjects(); });
    folderCouchTop.open();

    var folderBodySetupError = gui.addFolder('Body Setup Error');
    folderBodySetupError.add(ctrl_body_setup_error, "rotateX", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodySetupError.add(ctrl_body_setup_error, "rotateY", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodySetupError.add(ctrl_body_setup_error, "rotateZ", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodySetupError.add(ctrl_body_setup_error, "translateX", -30.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodySetupError.add(ctrl_body_setup_error, "translateY", -30.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodySetupError.add(ctrl_body_setup_error, "translateZ", -30.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodySetupError.add(ctrl_body_setup_error, "mode", enum_transf_mode).listen().onChange(function () { updateSceneObjects(); });   
    folderBodySetupError.open();

    var folderBodyPosCorrection = gui.addFolder('Body Position Correction');
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "rotateX", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "rotateY", -10.0, 10.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "rotateZ", -180.0, 180.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "translateX", -30.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "translateY", -30.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "translateZ", -30.0, 30.0).step(0.1).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.add(ctrl_body_pos_correction_transf, "mode", enum_transf_mode).listen().onChange(function () { updateSceneObjects(); });
    folderBodyPosCorrection.open();

    var folderGui = gui.addFolder('Options');
    folderGui.add(ctrl_gui, "showHelperPlane").listen().onChange(function () { updateSceneObjects(); });
    folderGui.add(ctrl_gui, "showModel").listen().onChange(function () { updateSceneObjects(); });
    folderGui.open();

    gui.open();
  };

  // create all axes lines
  var buildAxes = function (length) {

    // create single axis line
    var buildAxis = function (src, dst, colorHex, dashed) {
      var geom = new THREE.Geometry(),
        mat;
      if (dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
      } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
      }
      geom.vertices.push(src.clone());
      geom.vertices.push(dst.clone());
      geom.computeLineDistances();

      return new THREE.LineSegments(geom, mat);
    };
    //

    var axes = new THREE.Object3D();
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x228b22, false)); // +Y
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x228b22, true)); // -Y
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z
    return axes;
  }
  // add axes labels to the scene
  function addAxesLabel() {

    // create text
    var buildText = function (text, font, color, position) {
      var textGeometry = new THREE.TextGeometry(text, {
        size: 15,
        height: 3,
        font: font
      });
      textGeometry.computeBoundingBox();
      var textMaterial = new THREE.MeshBasicMaterial({ color: color, overdraw: 0.5 });
      var textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(position.x, position.y, position.z);
      return textMesh;
    };
    //

    var loader = new THREE.FontLoader();
    loader.load('./three.js/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      scene.add(buildText("X", font, 0xff0000,
        new THREE.Vector3(300, 5, 5)));
      scene.add(buildText("Y", font, 0x2c602c,
        new THREE.Vector3(5, 300, 5)));
      scene.add(buildText("Z", font, 0x0000ff,
        new THREE.Vector3(5, 5, 300)));
    });
  }

  var addSceneObjects = function () {
    {
      var geometry = new THREE.BoxGeometry(85, 110, 120);
      var material = new THREE.MeshLambertMaterial({ color: 0xAA5585, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_base = new THREE.Mesh(geometry, material);
      obj_base_target = new THREE.Mesh(geometry.clone(), material.clone());

      obj_base.material.transparent = true;
      obj_base.material.opacity = config_material.default_opacity;

      scene.add(obj_base);
      scene.add(obj_base_target);
    }

    {
      var geometry = new THREE.BoxGeometry(90, 120, 70);
      var material = new THREE.MeshLambertMaterial({ color: 0xD46A6A, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_couch = new THREE.Mesh(geometry, material);
      obj_couch_target = new THREE.Mesh(geometry.clone(), material.clone());

      obj_couch.material.transparent = true;
      obj_couch.material.opacity = 0.15;

      scene.add(obj_couch);
      scene.add(obj_couch_target);
    }

    {
      var geometry = new THREE.BoxGeometry(80, 110, 25);
      var material = new THREE.MeshLambertMaterial({ color: 0xD49A6A, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_robotic = new THREE.Mesh(geometry, material);
      obj_robotic_target = new THREE.Mesh(geometry.clone(), material.clone());

      obj_robotic.material.transparent = true;
      obj_robotic.material.opacity = config_material.default_opacity;

      scene.add(obj_robotic);
      scene.add(obj_robotic_target);
    }

    {
      var geometry = new THREE.BoxGeometry(100, 220, 1);
      var material = new THREE.MeshLambertMaterial({ color: 0xcbcbcb, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_top = new THREE.Mesh(geometry, material);
      obj_top_target = new THREE.Mesh(geometry.clone(), material.clone());

      obj_top.material.transparent = true;
      obj_top.material.opacity = config_material.default_opacity;

      scene.add(obj_top);
      scene.add(obj_top_target);
    }

    {
      var geometry = new THREE.BoxGeometry(70, 180, 20);
      var material = new THREE.MeshLambertMaterial({ color: 0xFFB218, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_body = new THREE.Mesh(geometry, material);
      obj_body_target = new THREE.Mesh(geometry.clone(), material.clone());

      obj_body.material.transparent = true;
      obj_body.material.opacity = config_material.default_opacity;

      scene.add(obj_body);
      scene.add(obj_body_target);
    }

    {
      var geometry = new THREE.BoxGeometry(200, 400, 1);
      var material = new THREE.MeshLambertMaterial({ color: 0xF4FC03, shading: THREE.FlatShading, overdraw: 0.5 });
      obj_helper_plane = new THREE.Mesh(geometry, material);

      obj_helper_plane.material.transparent = true;
      obj_helper_plane.material.opacity = config_material.default_opacity;

      scene.add(obj_helper_plane);
    }

    // load obj model and add it to geometry objects
    {
      var objLoader = new THREE.OBJLoader();
      objLoader.setPath('obj/legoman/');
      objLoader.load('LEGO_Man.obj', function (object) {
        obj_model = object; // ref
        obj_model.scale.set(30, 30, 30);
        obj_model.position.set(0, -75, 0);
        var mat_model = new THREE.MeshLambertMaterial({ color: 0xB35A1E, shading: THREE.FlatShading, overdraw: 0.5 });
        mat_model.opacity = config_material.default_opacity;
        mat_model.transparent = true;
        obj_model.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = mat_model;
          }
        });
        obj_body.add(obj_model); // added

        obj_model_target = obj_model.clone(); // clone
        var mat_model_target = new THREE.MeshLambertMaterial({ color: 0xB35A1E, shading: THREE.FlatShading, overdraw: 0.5 });
        obj_model_target.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = mat_model_target;
          }
        });
        obj_body_target.add(obj_model_target); // added
      },
        function (xhr) { },
        function (xhr) { console.error('Cannot loading model'); }
      );
    };
  };

  var updateSceneObjects = function () {

    {// top   FIXME: different tx convention
      // M_{top-world}
      var m_top_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(ctrl_top_world_transf.rotateX),
        RTGEO.degree_to_rad(ctrl_top_world_transf.rotateY),
        RTGEO.degree_to_rad(ctrl_top_world_transf.rotateZ));
      var v_top_translate = new THREE.Vector4(
        ctrl_top_world_transf.translateX,
        ctrl_top_world_transf.translateY,
        ctrl_top_world_transf.translateZ);
      v_top_translate = v_top_translate.applyMatrix4(m_top_transform);
      m_top_transform.elements[12] = v_top_translate.x;
      m_top_transform.elements[13] = v_top_translate.y;
      m_top_transform.elements[14] = v_top_translate.z;

      obj_top.matrix = m_top_transform;
      obj_top.matrixAutoUpdate = false;
    }

    {// body
      // M_{body-top}
      var m_body_top_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_body_top_transf.rotateX),
        RTGEO.degree_to_rad(config_body_top_transf.rotateY),
        RTGEO.degree_to_rad(config_body_top_transf.rotateZ));
      var v_body_top_translate = new THREE.Vector4(
        config_body_top_transf.translateX,
        config_body_top_transf.translateY,
        config_body_top_transf.translateZ);
      v_body_top_translate = v_body_top_translate.applyMatrix4(m_body_top_transform);
      m_body_top_transform.elements[12] = v_body_top_translate.x;
      m_body_top_transform.elements[13] = v_body_top_translate.y;
      m_body_top_transform.elements[14] = v_body_top_translate.z;

      // M_{body-world} = M_{top-world} * M_{body-top}
      var m_body_transform = new THREE.Matrix4();
      m_body_transform = m_body_transform.multiplyMatrices(obj_top.matrix, m_body_top_transform);

      obj_body.matrix = m_body_transform;
      obj_body.matrixAutoUpdate = false;
      obj_body.material.visible = !ctrl_gui.showModel;
    }

    {// body target position

      if (ctrl_body_pos_correction_transf.mode == enum_transf_mode.INTRINSIC_ORIGIN_zxy) {

        /*the rotation part of the 4x4 matrix from the current body transformation M_{body-world} */
        var m_body_rotation = new THREE.Matrix4();
        m_body_rotation.copy(obj_body.matrix);
        m_body_rotation.elements[12] = 0;
        m_body_rotation.elements[13] = 0;
        m_body_rotation.elements[14] = 0;

        /*the translation part of the 4x4 matrix from the current body transformation M_{body-world} */
        var v_body_rotated_translate = new THREE.Vector4(
          obj_body.matrix.elements[12],
          obj_body.matrix.elements[13],
          obj_body.matrix.elements[14]);

        /*the !intrinsic! translation of the current transformation*/
        var m_inverse_body_rotation = new THREE.Matrix4();
        m_inverse_body_rotation = m_inverse_body_rotation.getInverse(m_body_rotation); // trasnpose!?
        var v_body_translate = new THREE.Vector4();
        v_body_translate.copy(v_body_rotated_translate);
        v_body_translate = v_body_translate.applyMatrix4(m_inverse_body_rotation);

        /*the !intrinsic! rotation angles of the current transformation*/
        var v_body_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(m_body_rotation);
        var v_body_rotation_angles_deg = new THREE.Vector4(
          RTGEO.rad_to_degree(v_body_rotation_angles.x),
          RTGEO.rad_to_degree(v_body_rotation_angles.y),
          RTGEO.rad_to_degree(v_body_rotation_angles.z));

        // transformation for body target position
        // M_{bodytarget-world} =~ M_{ (body-world)+(bodytarget-body) }
        var m_bodytarget_transform = RTGEO.to_Euler_ZXY_Matrix4(
          RTGEO.degree_to_rad(v_body_rotation_angles_deg.x + ctrl_body_pos_correction_transf.rotateX),
          RTGEO.degree_to_rad(v_body_rotation_angles_deg.y + ctrl_body_pos_correction_transf.rotateY),
          RTGEO.degree_to_rad(v_body_rotation_angles_deg.z + ctrl_body_pos_correction_transf.rotateZ));
        var v_bodytarget_translate = new THREE.Vector4(
          v_body_translate.x + ctrl_body_pos_correction_transf.translateX,
          v_body_translate.y + ctrl_body_pos_correction_transf.translateY,
          v_body_translate.z + ctrl_body_pos_correction_transf.translateZ);
        v_bodytarget_translate = v_bodytarget_translate.applyMatrix4(m_bodytarget_transform);
        m_bodytarget_transform.elements[12] = v_bodytarget_translate.x;
        m_bodytarget_transform.elements[13] = v_bodytarget_translate.y;
        m_bodytarget_transform.elements[14] = v_bodytarget_translate.z;

        obj_body_target.matrix = m_bodytarget_transform;
        obj_body_target.matrixAutoUpdate = false;
        obj_body_target.material.visible = !ctrl_gui.showModel;

        // visualize helper plane
        var m_helperplane_transform = new THREE.Matrix4();
        m_helperplane_transform.copy(m_bodytarget_transform);
        m_helperplane_transform.elements[12] = 0; // ignore translation for better understaning
        m_helperplane_transform.elements[13] = 0;
        m_helperplane_transform.elements[14] = 0;
        obj_helper_plane.matrix = m_helperplane_transform;
        obj_helper_plane.matrixAutoUpdate = false;
        obj_helper_plane.visible = ctrl_gui.showHelperPlane;
      }
      else if (ctrl_body_pos_correction_transf.mode == enum_transf_mode.INTRINSIC_ORIGIN_Zxy) {

        // M_{bodytarget-body}
        var m_bodytarget_body_transform = RTGEO.to_Euler_ZXY_Matrix4(
          RTGEO.degree_to_rad(ctrl_body_pos_correction_transf.rotateX),
          RTGEO.degree_to_rad(ctrl_body_pos_correction_transf.rotateY),
          RTGEO.degree_to_rad(ctrl_body_pos_correction_transf.rotateZ));
        var v_bodytarget_body_translate = new THREE.Vector4(
          ctrl_body_pos_correction_transf.translateX,
          ctrl_body_pos_correction_transf.translateY,
          ctrl_body_pos_correction_transf.translateZ);
        v_bodytarget_body_translate = v_bodytarget_body_translate.applyMatrix4(m_bodytarget_body_transform);
        m_bodytarget_body_transform.elements[12] = v_bodytarget_body_translate.x;
        m_bodytarget_body_transform.elements[13] = v_bodytarget_body_translate.y;
        m_bodytarget_body_transform.elements[14] = v_bodytarget_body_translate.z;

        // transformatino matrix for undo/redo z rotation of M_{body-world}
        var v_body_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(obj_body.matrix);
        var v_body_rotation_angles_deg = new THREE.Vector4(
          RTGEO.rad_to_degree(v_body_rotation_angles.x),
          RTGEO.rad_to_degree(v_body_rotation_angles.y),
          RTGEO.rad_to_degree(v_body_rotation_angles.z));
        var m_undo_body_rotation_z = RTGEO.to_Euler_ZXY_Matrix4(0, 0, RTGEO.degree_to_rad(-v_body_rotation_angles_deg.z));
        var m_redo_body_rotation_z = RTGEO.to_Euler_ZXY_Matrix4(0, 0, RTGEO.degree_to_rad(v_body_rotation_angles_deg.z));

        // transformation for body target position
        // M_{bodytarget-world} = M_redo_z * M_{bodytarget-body} * M_undo_z * M_{body-world}
        var m_bodytarget_transform = new THREE.Matrix4();
        m_bodytarget_transform = m_bodytarget_transform.multiplyMatrices(m_undo_body_rotation_z, obj_body.matrix);
        m_bodytarget_transform = m_bodytarget_transform.multiplyMatrices(m_bodytarget_body_transform, m_bodytarget_transform);
        m_bodytarget_transform = m_bodytarget_transform.multiplyMatrices(m_redo_body_rotation_z, m_bodytarget_transform);

        obj_body_target.matrix = m_bodytarget_transform;
        obj_body_target.matrixAutoUpdate = false;
        obj_body_target.material.visible = !ctrl_gui.showModel;

        // visualize helper plane
        var m_helperplane_transform = new THREE.Matrix4();
        m_helperplane_transform = m_helperplane_transform.multiplyMatrices(m_redo_body_rotation_z, m_bodytarget_body_transform);
        // for better understanding we don't disable the plane translation visualization.
        obj_helper_plane.matrix = m_helperplane_transform;
        obj_helper_plane.matrixAutoUpdate = false;
        obj_helper_plane.visible = ctrl_gui.showHelperPlane;
      }

    }

    {//model
      obj_model.visible = ctrl_gui.showModel;
      obj_model_target.visible = ctrl_gui.showModel;
    }

    {// couch top target position
      // M_{bodytarget-toptarget}
      var m_body_top_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_body_top_transf.rotateX),
        RTGEO.degree_to_rad(config_body_top_transf.rotateY),
        RTGEO.degree_to_rad(config_body_top_transf.rotateZ));
      var v_body_top_translate = new THREE.Vector4(
        config_body_top_transf.translateX,
        config_body_top_transf.translateY,
        config_body_top_transf.translateZ);
      v_body_top_translate = v_body_top_translate.applyMatrix4(m_body_top_transform);
      m_body_top_transform.elements[12] = v_body_top_translate.x;
      m_body_top_transform.elements[13] = v_body_top_translate.y;
      m_body_top_transform.elements[14] = v_body_top_translate.z;
      // M_{bodytarget-toptarget}^-1
      var m_inverse_body_top_transform = new THREE.Matrix4();
      m_inverse_body_top_transform = m_inverse_body_top_transform.getInverse(m_body_top_transform);

      // M_{toptarget-world} = M_{bodytarget-world} * M_{bodytarget-toptarget}^-1
      var m_toptarget_transform = new THREE.Matrix4();
      m_toptarget_transform = m_toptarget_transform.multiplyMatrices(obj_body_target.matrix, m_inverse_body_top_transform);
      obj_top_target.matrix = m_toptarget_transform;
      obj_top_target.matrixAutoUpdate = false;
    }

    // visualize other objects

    {// robotic
      // M_{top-robotic}
      var m_top_robotic_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateX),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateY),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateZ));
      var v_top_robotic_translate = new THREE.Vector4(
        config_top_robotic_transf.translateX,
        config_top_robotic_transf.translateY,
        config_top_robotic_transf.translateZ);
      v_top_robotic_translate = v_top_robotic_translate.applyMatrix4(m_top_robotic_transform);
      m_top_robotic_transform.elements[12] = v_top_robotic_translate.x;
      m_top_robotic_transform.elements[13] = v_top_robotic_translate.y;
      m_top_robotic_transform.elements[14] = v_top_robotic_translate.z;
      // M_{top-robotic}^-1
      var m_inverse_top_robotic_transform = new THREE.Matrix4();
      m_inverse_top_robotic_transform = m_inverse_top_robotic_transform.getInverse(m_top_robotic_transform);

      // M_{robotic-world} = M_{top-world} * M_{top-robotic}^-1
      var m_robotic_transform = new THREE.Matrix4();
      m_robotic_transform = m_robotic_transform.multiplyMatrices(obj_top.matrix, m_inverse_top_robotic_transform);
      obj_robotic.matrix = m_robotic_transform;
      obj_robotic.matrixAutoUpdate = false;
    }
    {// robotic target
      // M_{toptarget-robotictarget}
      var m_toptarget_robotictarget_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateX),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateY),
        RTGEO.degree_to_rad(config_top_robotic_transf.rotateZ));
      var v_toptarget_robotictarget_translate = new THREE.Vector4(
        config_top_robotic_transf.translateX,
        config_top_robotic_transf.translateY,
        config_top_robotic_transf.translateZ);
      v_toptarget_robotictarget_translate = v_toptarget_robotictarget_translate.applyMatrix4(m_toptarget_robotictarget_transform);
      m_toptarget_robotictarget_transform.elements[12] = v_toptarget_robotictarget_translate.x;
      m_toptarget_robotictarget_transform.elements[13] = v_toptarget_robotictarget_translate.y;
      m_toptarget_robotictarget_transform.elements[14] = v_toptarget_robotictarget_translate.z;
      // M_{toptarget-robotictarget}^-1
      var m_inverse_toptarget_robotictarget_transform = new THREE.Matrix4();
      m_inverse_toptarget_robotictarget_transform = m_inverse_toptarget_robotictarget_transform.getInverse(m_toptarget_robotictarget_transform);

      // M_{robotictarget-world} = M_{toptarget-world} * M_{toptarget-robotictarget}^-1
      var m_robotictarget_transform = new THREE.Matrix4();
      m_robotictarget_transform = m_robotictarget_transform.multiplyMatrices(obj_top_target.matrix, m_inverse_toptarget_robotictarget_transform);
      obj_robotic_target.matrix = m_robotictarget_transform;
      obj_robotic_target.matrixAutoUpdate = false;
    }

    {// couch
      /*the rotation part of the 4x4 matrix from the current robotic transformation M_{robotic-world} */
      var m_robotic_rotation = new THREE.Matrix4();
      m_robotic_rotation.copy(obj_robotic.matrix);
      m_robotic_rotation.elements[12] = 0;
      m_robotic_rotation.elements[13] = 0;
      m_robotic_rotation.elements[14] = 0;
      /*the translation part of the 4x4 matrix from the current robotic transformation M_{robotic-world} */
      var v_robotic_rotated_translate = new THREE.Vector4(
        obj_robotic.matrix.elements[12],
        obj_robotic.matrix.elements[13],
        obj_robotic.matrix.elements[14]);
      /*the !intrinsic! translation of the current transformation*/
      var m_inverse_robotic_rotation = new THREE.Matrix4();
      m_inverse_robotic_rotation = m_inverse_robotic_rotation.getInverse(m_robotic_rotation); // trasnpose!?
      var v_robotic_translate = new THREE.Vector4();
      v_robotic_translate.copy(v_robotic_rotated_translate);
      v_robotic_translate = v_robotic_translate.applyMatrix4(m_inverse_robotic_rotation);
      /*the !intrinsic! rotation angles of the current transformation*/
      var v_robotic_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(m_robotic_rotation);

      /* calculate transformation of the current robotic but only z rotated:
         M_{roboticZ-world} */
      var m_roboticZ_transform = RTGEO.to_Euler_ZXY_Matrix4(0, 0, v_robotic_rotation_angles.z);
      v_robotic_translate = v_robotic_translate.applyMatrix4(m_roboticZ_transform);
      m_roboticZ_transform.elements[12] = v_robotic_translate.x;
      m_roboticZ_transform.elements[13] = v_robotic_translate.y;
      m_roboticZ_transform.elements[14] = v_robotic_translate.z;

      // M_{roboticZ-couch}
      var m_roboticZ_couch_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateX),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateY),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateZ));
      var v_roboticZ_couch_translate = new THREE.Vector4(
        config_robotic_couch_transf.translateX,
        config_robotic_couch_transf.translateY,
        config_robotic_couch_transf.translateZ);
      v_roboticZ_couch_translate = v_roboticZ_couch_translate.applyMatrix4(m_roboticZ_couch_transform);
      m_roboticZ_couch_transform.elements[12] = v_roboticZ_couch_translate.x;
      m_roboticZ_couch_transform.elements[13] = v_roboticZ_couch_translate.y;
      m_roboticZ_couch_transform.elements[14] = v_roboticZ_couch_translate.z;
      // M_{roboticZ-couch}^-1
      var m_inverse_roboticZ_couch_transform = new THREE.Matrix4();
      m_inverse_roboticZ_couch_transform = m_inverse_roboticZ_couch_transform.getInverse(m_roboticZ_couch_transform);

      // M_{couch-world} = M_{roboticZ-world} * M_{roboticZ-couch}^-1
      var m_couch_transform = new THREE.Matrix4();
      m_couch_transform = m_couch_transform.multiplyMatrices(m_roboticZ_transform, m_inverse_roboticZ_couch_transform);
      obj_couch.matrix = m_couch_transform;
      obj_couch.matrixAutoUpdate = false;
    }
    {// couch target
      /*the rotation part of the 4x4 matrix from the target robotic transformation M_{robotictarget-world} */
      var m_robotictarget_rotation = new THREE.Matrix4();
      m_robotictarget_rotation.copy(obj_robotic_target.matrix);
      m_robotictarget_rotation.elements[12] = 0;
      m_robotictarget_rotation.elements[13] = 0;
      m_robotictarget_rotation.elements[14] = 0;
      /*the translation part of the 4x4 matrix from the target robotic transformation M_{robotictarget-world} */
      var v_robotictarget_rotated_translate = new THREE.Vector4(
        obj_robotic_target.matrix.elements[12],
        obj_robotic_target.matrix.elements[13],
        obj_robotic_target.matrix.elements[14]);
      /*the !intrinsic! translation of the target transformation*/
      var m_inverse_robotictarget_rotation = new THREE.Matrix4();
      m_inverse_robotictarget_rotation = m_inverse_robotictarget_rotation.getInverse(m_robotictarget_rotation); // trasnpose!?
      var v_robotictarget_translate = new THREE.Vector4();
      v_robotictarget_translate.copy(v_robotictarget_rotated_translate);
      v_robotictarget_translate = v_robotictarget_translate.applyMatrix4(m_inverse_robotictarget_rotation);
      /*the !intrinsic! rotation angles of the target transformation*/
      var v_robotictarget_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(m_robotictarget_rotation);

      /* calculate transformation of the target robotic but only z rotated:
         M_{robotictargetZ-world} */
      var m_robotictargetZ_transform = RTGEO.to_Euler_ZXY_Matrix4(0, 0, v_robotictarget_rotation_angles.z);
      v_robotictarget_translate = v_robotictarget_translate.applyMatrix4(m_robotictargetZ_transform);
      m_robotictargetZ_transform.elements[12] = v_robotictarget_translate.x;
      m_robotictargetZ_transform.elements[13] = v_robotictarget_translate.y;
      m_robotictargetZ_transform.elements[14] = v_robotictarget_translate.z;

      // M_{robotictargetZ-couchtarget}
      var m_robotictargetZ_couchtarget_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateX),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateY),
        RTGEO.degree_to_rad(config_robotic_couch_transf.rotateZ));
      var v_robotictargetZ_couchtarget_translate = new THREE.Vector4(
        config_robotic_couch_transf.translateX,
        config_robotic_couch_transf.translateY,
        config_robotic_couch_transf.translateZ);
      v_robotictargetZ_couchtarget_translate = v_robotictargetZ_couchtarget_translate.applyMatrix4(m_robotictargetZ_couchtarget_transform);
      m_robotictargetZ_couchtarget_transform.elements[12] = v_robotictargetZ_couchtarget_translate.x;
      m_robotictargetZ_couchtarget_transform.elements[13] = v_robotictargetZ_couchtarget_translate.y;
      m_robotictargetZ_couchtarget_transform.elements[14] = v_robotictargetZ_couchtarget_translate.z;
      // M_{robotictargetZ-couchtarget}^-1
      var m_inverse_robotictargetZ_couchtarget_transform = new THREE.Matrix4();
      m_inverse_robotictargetZ_couchtarget_transform = m_inverse_robotictargetZ_couchtarget_transform.getInverse(m_robotictargetZ_couchtarget_transform);

      // M_{couchtarget-world} = M_{robotictargetZ-world} * M_{robotictargetZ-couchtarget}^-1
      var m_couchtarget_transform = new THREE.Matrix4();
      m_couchtarget_transform = m_couchtarget_transform.multiplyMatrices(m_robotictargetZ_transform, m_inverse_robotictargetZ_couchtarget_transform);
      obj_couch_target.matrix = m_couchtarget_transform;
      obj_couch_target.matrixAutoUpdate = false;
    }

    {// base
      // M_{base-world}
      var m_base_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_base_world_transf.rotateX),
        RTGEO.degree_to_rad(config_base_world_transf.rotateY),
        RTGEO.degree_to_rad(config_base_world_transf.rotateZ));
      var v_base_translate = new THREE.Vector4(
        config_base_world_transf.translateX,
        config_base_world_transf.translateY,
        config_base_world_transf.translateZ);
      v_base_translate = v_base_translate.applyMatrix4(m_base_transform);
      m_base_transform.elements[12] = v_base_translate.x;
      m_base_transform.elements[13] = v_base_translate.y;
      m_base_transform.elements[14] = v_base_translate.z;

      var v_couch_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(obj_couch.matrix);
      var m_couch_rot_z = RTGEO.to_Euler_ZXY_Matrix4(0, 0, v_couch_rotation_angles.z);
      m_base_transform = m_base_transform.multiplyMatrices(m_couch_rot_z, m_base_transform);

      obj_base.matrix = m_base_transform;
      obj_base.matrixAutoUpdate = false;
    }
    {// base target
      // M_{basetarget-world}
      var m_basetarget_transform = RTGEO.to_Euler_ZXY_Matrix4(
        RTGEO.degree_to_rad(config_base_world_transf.rotateX),
        RTGEO.degree_to_rad(config_base_world_transf.rotateY),
        RTGEO.degree_to_rad(config_base_world_transf.rotateZ));
      var v_basetarget_translate = new THREE.Vector4(
        config_base_world_transf.translateX,
        config_base_world_transf.translateY,
        config_base_world_transf.translateZ);
      v_basetarget_translate = v_basetarget_translate.applyMatrix4(m_basetarget_transform);
      m_basetarget_transform.elements[12] = v_basetarget_translate.x;
      m_basetarget_transform.elements[13] = v_basetarget_translate.y;
      m_basetarget_transform.elements[14] = v_basetarget_translate.z;

      var v_couchtarget_rotation_angles/*rad*/ = RTGEO.to_Euler_ZXY_Vector4(obj_couch_target.matrix);
      var m_couchtarget_rot_z = RTGEO.to_Euler_ZXY_Matrix4(0, 0, v_couchtarget_rotation_angles.z);
      m_basetarget_transform = m_basetarget_transform.multiplyMatrices(m_couchtarget_rot_z, m_basetarget_transform);

      obj_base_target.matrix = m_basetarget_transform;
      obj_base_target.matrixAutoUpdate = false;
    }

  };

  var init = function (canvas/*dom element ID*/) {

    // init gui controls
    initControls();

    // init scene
    scene = new THREE.Scene();

    // init camera
    {
      camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1, 10000);
      camera.position.set(150, -200, 200);
      camera.up.set(0, 0, 1);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    // init lights
    {
      var ambLight = new THREE.AmbientLight(0x303030);
      scene.add(ambLight);
      var light1 = new THREE.DirectionalLight(0xffffff, .6);
      light1.position.set(800, 400, 800);
      scene.add(light1);
      var light2 = new THREE.DirectionalLight(0xffffff, .3);
      light2.position.set(-400, -400, 800);
      scene.add(light2);
      var light3 = new THREE.DirectionalLight(0xffffff, .1);
      light3.position.set(0, 0, -400);
      scene.add(light3);
    }

    // init coordinate axes
    {
      scene.add(buildAxes(1000));
      addAxesLabel();
    }

    // init objects
    addSceneObjects();

    // init renderer
    {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor(0xf0f0f0);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      var container = document.getElementById(canvas);
      container.appendChild(renderer.domElement);
    }

    // init control
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // update objects
    updateSceneObjects();
  };

  var onWindowResize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  var show = function () {
    requestAnimationFrame(show);

    // do animation under a specific max fps
    var now = Date.now();
    var delta = now - then;
    if (delta > interval) {
      then = now - (delta % interval);
    }
    else {
      return;
    }

    renderer.render(scene, camera);
  };

  /* ****************************** */
  /* ***** PUBLIC METHODS      **** */
  /* ****************************** */

  return {
    init: init,
    show: show
  };

})();