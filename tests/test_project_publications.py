import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('generate_projects_pages', ROOT / 'scripts/generate_projects_pages.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class ProjectPublicationsTest(unittest.TestCase):
    def test_each_project_renders_its_publication_links(self):
        data = json.loads((ROOT / 'assets/data/projects.json').read_text())
        template = (ROOT / 'projects/project-template.html').read_text()
        for project in data['projects']:
            with self.subTest(project=project['slug']):
                self.assertTrue(project.get('publications'))
                page = generator.render_project(template, project)
                for publication in project['publications']:
                    self.assertIn(publication['url'], page)
                    self.assertIn(publication['title'], page)
                self.assertNotIn('Papers (to be added)', page)


if __name__ == '__main__':
    unittest.main()
