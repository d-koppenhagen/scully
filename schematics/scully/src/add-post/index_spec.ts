import {HostTree} from '@angular-devkit/schematics';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {getFileContent} from '@schematics/angular/utility/test';
import * as path from 'path';

import {setupProject} from '../utils/test-utils';
import {Schema} from './schema';

const collectionPath = path.join(__dirname, '../collection.json');
const META_DATA_TEMPLATE_PATH = 'assets/meta-data-template.yml';

describe('add-post', () => {
  const schematicRunner = new SchematicTestRunner('scully-schematics', collectionPath);
  const project = 'foo';
  const defaultOptions: Schema = {
    name: 'Foo barBaz',
  };
  let appTree: UnitTestTree;
  const expectedFileName = '/blog/foo-bar-baz.md';

  beforeEach(async () => {
    appTree = new UnitTestTree(new HostTree());
    appTree = await setupProject(appTree, schematicRunner, project);
  });

  describe('when using the default options', () => {
    beforeEach(async () => {
      appTree = await schematicRunner.runSchematicAsync('post', defaultOptions, appTree).toPromise();
    });

    it('should create a new dasherized post', () => {
      expect(appTree.files).toContain(expectedFileName);
      const mdFileContent = getFileContent(appTree, expectedFileName);
      expect(mdFileContent).toMatch(/title: Foo barBaz/g);
      expect(mdFileContent).toMatch(/description: blog description/g);
      expect(mdFileContent).toMatch(/publish: false/g);
    });
  });

  describe('when using a different `target`', () => {
    beforeEach(async () => {
      appTree = await schematicRunner
        .runSchematicAsync('post', {...defaultOptions, target: 'foo/bar'}, appTree)
        .toPromise();
    });

    it('should create a new dasherized post inside the target dir', () => {
      const expected = '/foo/bar/foo-bar-baz.md';
      expect(appTree.files).toContain(expected);
      const mdFileContent = getFileContent(appTree, expected);
      expect(mdFileContent).toMatch(/title: Foo barBaz/g);
      expect(mdFileContent).toMatch(/description: blog description/g);
      expect(mdFileContent).toMatch(/publish: false/g);
    });
  });

  describe('when using `metaDataFile` option', () => {
    beforeEach(async () => {
      appTree = await schematicRunner
        .runSchematicAsync('post', {...defaultOptions, metaDataFile: META_DATA_TEMPLATE_PATH}, appTree)
        .toPromise();
    });

    it('should add the meta data but keep title from options', () => {
      expect(appTree.files).toContain(expectedFileName);
      const mdFileContent = getFileContent(appTree, expectedFileName);
      expect(mdFileContent).toMatch(/title: Foo barBaz/g);
      expect(mdFileContent).toMatch(/thumbnail: assets\/images\/default\.jpg/g);
      expect(mdFileContent).toMatch(/author: John Doe/g);
      expect(mdFileContent).toMatch(/mail: John.Doe@example.com/g);
      expect(mdFileContent).toMatch(/keywords:\s+-\ angular\s+-\ scully/s);
      expect(mdFileContent).toMatch(/language: en/g);
    });
  });

  describe('when target file already exists', () => {
    beforeEach(() => {
      appTree.create(expectedFileName, 'foo');
    });

    it('should not touch existing file', async () => {
      let error = '';
      try {
        await schematicRunner.runSchematicAsync('post', defaultOptions, appTree).toPromise();
      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/Error: foo-bar-baz exist/g);
      expect(getFileContent(appTree, expectedFileName)).toEqual('foo');
    });
  });

  describe('when specify a file extension', () => {
    it('should use the specified file extension', async () => {
      const extension = 'adoc';
      appTree = await schematicRunner
        .runSchematicAsync('post', {...defaultOptions, extension}, appTree)
        .toPromise();
      expect(appTree.files).toContain('/blog/foo-bar-baz.adoc');
    });

    it('should use `md` file extension by default', async () => {
      const extension = '';
      appTree = await schematicRunner
        .runSchematicAsync('post', {...defaultOptions, extension}, appTree)
        .toPromise();
      expect(appTree.files).toContain(expectedFileName);
    });

    it('should throw an error when file extension is invalid', async () => {
      const extension = 'invalid?ext';
      let error = '';
      try {
        await schematicRunner.runSchematicAsync('post', {...defaultOptions, extension}, appTree).toPromise();
      } catch (e) {
        error = e;
      }
      expect(error).toMatch(/Error: invalid\?ext is not a valid file extension/g);
    });
  });
});
